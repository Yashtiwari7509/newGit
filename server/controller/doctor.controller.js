import { validationResult } from "express-validator";
import doctorModel from "../models/doctor.model.js";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

export async function registerDoctor(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password, email } = req.body;

    // Check if doctor already exists
    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
      return res.status(409).json({ message: "Email already exists" }); // 409 Conflict
    }

    // Hash password
    const hashedPassword = await doctorModel.hashPassword(password);

    // Create doctor
    const newDoctor = await doctorModel.create({
      ...req.body,
      password: hashedPassword,
    });

    // Generate JWT Token
    const token = newDoctor.generateAuthToken();

    // Remove password from response
    const doctorResponse = newDoctor.toObject();
    delete doctorResponse.password;

    // Send response
    return res.status(201).json({
      message: "Doctor registered successfully",
      token,
      doctor: doctorResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function signInDoctor(req, res) {
  try {
    // Validate request input
    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log(email, password);

    // Check if doctor exists
    const doctor = await doctorModel.findOne({ email });
    console.log(doctor);

    if (!doctor) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isPasswordValid = await doctor.comparePassword(password);
    console.log(isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate authentication token
    const token = doctor.generateAuthToken();

    // Remove password from response
    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    // Respond with doctor data & token
    return res.status(200).json({
      message: "Login successful",
      token,
      doctor: doctorResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export const getDoctorProfile = async (req, res) => {
  try {
    if (!req.doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Remove password from doctor data before sending response
    const doctorResponse = req.doctor.toObject();
    delete doctorResponse.password;

    return res.status(200).json(doctorResponse);
  } catch (error) {
    console.error("Profile retrieval error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateDoctorStatus = async (req, res) => {
  try {
    console.log("hello from asy");

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
    const userId = decoded._id; // Ensure your JWT contains `id`

    // Extract status from request
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be a boolean value.",
      });
    }

    // Update user status
    const updatedUser = await doctorModel
      .findByIdAndUpdate(
        userId,
        {
          isOnline,
          lastActive: new Date(),
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      )
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${isOnline ? "online" : "offline"}.`,
      data: {
        isOnline: updatedUser.isOnline,
        lastActive: updatedUser.lastActive,
      },
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating status.",
      error: error.message,
    });
  }
};

export const getAvailableDoctors = async (req, res) => {
  try {
    const { specialization, isOnline } = req.query;

    // Build the query object
    const query = {};

    // Add online status to query if provided
    if (isOnline !== undefined) {
      // Convert string to boolean
      query.isOnline = isOnline === "true";
    }

    // Add specialization to query if provided
    if (specialization) {
      query.specialization = specialization;
    }

    // Find doctors matching the criteria
    const doctors = await doctorModel
      .find(query)
      .select({
        firstName: 1,
        lastName: 1,
        specialization: 1,
        experience: 1,
        phoneNumber: 1,
        isOnline: 1,
        qualifications: 1,
        reviews: 1,
        availability: 1,
      })
      .sort({ experience: -1 }); // Sort by experience (most experienced first)

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error("Error finding doctors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctors",
      error: error.message,
    });
  }
};

export const addReview = async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Get user from request (set by authUser middleware)
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Find the doctor and add the review
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Ensure reviews array exists
    if (!doctor.reviews) {
      doctor.reviews = [];
    }

    // Check if user has already reviewed this doctor
    const existingReviewIndex = doctor.reviews.findIndex(
      (review) => review.userId && review.userId.equals(user._id)
    );

    // Parse rating as number
    const numericRating = Number(rating);

    if (existingReviewIndex !== -1) {
      // Update existing review
      doctor.reviews[existingReviewIndex] = {
        ...doctor.reviews[existingReviewIndex],
        rating: numericRating,
        comment,
        userFirstName: user.firstName,
        userLastName: user.lastName,
        createdAt: new Date(),
      };
    } else {
      // Add new review
      doctor.reviews.push({
        userId: user._id,
        rating: numericRating,
        comment,
        userFirstName: user.firstName,
        userLastName: user.lastName,
        createdAt: new Date(),
      });
    }

    // Calculate average rating safely
    const validRatings = doctor.reviews.filter(
      (review) => !isNaN(review.rating)
    );
    const totalRating = validRatings.reduce(
      (sum, review) => sum + Number(review.rating),
      0
    );
    const numRatings = validRatings.length;

    // Set average rating and total reviews
    doctor.averageRating =
      numRatings > 0 ? Number((totalRating / numRatings).toFixed(1)) : 0;
    doctor.totalReviews = doctor.reviews.length;

    await doctor.save();

    res.status(200).json({
      success: true,
      message:
        existingReviewIndex !== -1
          ? "Review updated successfully"
          : "Review added successfully",
      data: {
        review:
          doctor.reviews[
            existingReviewIndex !== -1
              ? existingReviewIndex
              : doctor.reviews.length - 1
          ],
        averageRating: doctor.averageRating,
        totalReviews: doctor.totalReviews,
      },
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding review",
      error: error.message,
    });
  }
};

export const getReviews = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const doctor = await doctorModel
      .findById(doctorId)
      .select("reviews averageRating totalReviews")
      .populate("reviews.userId", "firstName lastName");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        reviews: doctor.reviews,
        averageRating: doctor.averageRating,
        totalReviews: doctor.totalReviews,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching reviews",
      error: error.message,
    });
  }
};
