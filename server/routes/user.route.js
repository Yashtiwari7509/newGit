import express from "express";
import { body } from "express-validator";
import {
  getAvailableUsers,
  getUserProfile,
  registerUser,
  signInUser,
  updateUserStatus,
} from "../controller/user.controller.js";
import { authUser } from "../middleware/auth.middleware.js";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Must be a valid email"),
    body("password")
      .isLength({ min: 4 })
      .withMessage("Password must be at least 4 characters long"),
    body("firstName")
      .isLength({ min: 3, max: 20 })
      .withMessage("First name must be between 3 to 20 characters"),
    body("lastName")
      .isLength({ min: 3, max: 20 })
      .withMessage("Last name must be between 3 to 20 characters"),
    body("phoneNumber")
      .isMobilePhone()
      .withMessage("Must be a valid mobile phone number"),
    body("dateOfBirth")
      .isISO8601()
      .withMessage("Must be a valid date in YYYY-MM-DD format"),
    body("gender")
      .isIn(["Male", "Female", "Other"])
      .withMessage("Gender must be either Male, Female, or Other"),
  ],
  registerUser
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Must be a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  signInUser
);

router.get("/profile", authUser, getUserProfile);

// Update user online status
router.put("/status", updateUserStatus);

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
    const userId = decoded._id;

    // Update user status
    await userModel.findByIdAndUpdate(
      userId,
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

router.get("/available", getAvailableUsers);

export default router;
