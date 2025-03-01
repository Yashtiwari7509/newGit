import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import connectToDb from "./db/db.js";
import userRouter from "./routes/user.route.js";
import doctorRouter from "./routes/doctor.route.js";
import fitnessRouter from "./routes/fitness.route.js";
import aiRouter from "./routes/ai.js";
import ayushmanRouter from "./routes/ayushman.route.js";
import consultationRouter from "./routes/consultation.route.js";

const app = express();

// Connect to MongoDB
connectToDb().catch(console.error);

// Configure CORS with more options
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.CORS_ORIGIN || "*"
      : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// Request size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Health check endpoint for Render
app.get("/", (req, res) => {
  res.status(200).json({
    status: "UP",
    message: "Healthcare API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/users", userRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/fitness", fitnessRouter);
app.use("/api/ai", aiRouter);
app.use("/api/ayushman", ayushmanRouter);
app.use("/api/consultations", consultationRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Resource not found" });
});

export default app;
