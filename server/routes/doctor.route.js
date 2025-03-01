import express from "express";
import { body } from "express-validator";
import {
  registerDoctor,
  signInDoctor,
  getDoctorProfile,
  getAvailableDoctors,
  updateDoctorStatus,
  addReview,
  getReviews,
} from "../controller/doctor.controller.js";
import { authDoctor, authUser } from "../middleware/auth.middleware.js";
import jwt from "jsonwebtoken";
import doctorModel from "../models/doctor.model.js";

const router = express.Router();

// Doctor Registration Route
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Must be a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("firstName")
      .isLength({ min: 3, max: 20 })
      .withMessage("First name must be between 3 to 20 characters"),
    body("lastName")
      .isLength({ min: 3, max: 20 })
      .withMessage("Last name must be between 3 to 20 characters"),
    body("phoneNumber")
      .isMobilePhone()
      .withMessage("Must be a valid mobile phone number"),
    body("specialization").notEmpty().withMessage("Specialization is required"),
    body("experience")
      .isInt({ min: 0 })
      .withMessage("Experience must be at least 1 year"),
    body("qualifications")
      .isArray({ min: 1 })
      .withMessage("At least one qualification is required"),
  ],
  registerDoctor
);

// Doctor Login Route
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Must be a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  signInDoctor
);

// Get Doctor Profile (Protected Route)
router.get("/profile", authDoctor, getDoctorProfile);

router.put("/status", updateDoctorStatus);

router.get("/available", getAvailableDoctors);

// Review Routes
router.post(
  "/reviews",
  [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment").optional().isString().trim(),
    body("doctorId").isMongoId().withMessage("Invalid doctor ID"),
  ],
  authUser,
  addReview
);

router.get("/reviews", authUser, getReviews);

// Beacon endpoint for updating status when page unloads
router.post("/status/beacon", async (req, res) => {
  try {
    // Parse the raw body
    const body = req.body;
    const { isOnline, lastActive } =
      typeof body === "string" ? JSON.parse(body) : body;

    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. No token provided.",
      });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.SECRET_TOKEN);
    const doctorId = decoded._id;

    // Update doctor status
    await doctorModel.findByIdAndUpdate(
      doctorId,
      {
        isOnline,
        lastActive: lastActive || new Date(),
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    // Return a 204 No Content response
    res.status(204).end();
  } catch (error) {
    console.error("Error updating status via beacon:", error);
    res.status(500).end();
  }
});

export default router;
