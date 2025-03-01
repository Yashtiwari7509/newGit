import http from "http";
import app from "./app.js";
import { setupSocketIO } from "./chat/chathandler.controller.js";

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

// Setup Socket.IO
setupSocketIO(server);

// const io = new Server(server, {

//   cors: {
//     origin: "http://localhost:8080",
//   },
// });

// io.on("connect", (socket) => {
//   console.log("a user connected", socket.id);
//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//   });
//   socket.on("create-something", (data) => {
//     console.log(data, "got data");
//   });
// });

// Start the server
server.listen(PORT, (err) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  } else {
    console.log(
      `Server running in ${
        process.env.NODE_ENV || "development"
      } mode on port ${PORT}`
    );
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});
