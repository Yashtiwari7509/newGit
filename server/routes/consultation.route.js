import { validationResult } from "express-validator";
import Consultation from "../models/Consultation.model.js";
import { authUser } from "../middleware/auth.middleware.js";
import express from "express";
import Doctor from "../models/doctor.model.js";

const router = express.Router();

// Book a consultation
router.post("/", authUser, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { doctor, user, date, notes } = req.body;

    const newConsultation = await Consultation.create({
      doctor,
      user,
      date,
      notes,
    });

    return res.status(201).json({
      message: "Consultation booked successfully",
      consultation: newConsultation,
    });
  } catch (error) {
    console.error("Consultation booking error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all consultations
router.get("/", authUser, async (req, res) => {
  try {
    const consultations = await Consultation.find().populate("doctor user");
    return res.status(200).json({ consultations });
  } catch (error) {
    console.error("Fetch consultations error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get a single consultation by ID
router.get("/:id", authUser, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id).populate(
      "doctor user"
    );
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }
    return res.status(200).json({ consultation });
  } catch (error) {
    console.error("Fetch consultation error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update a consultation (e.g., change status)
router.put("/:id", authUser, async (req, res) => {
  try {
    const updatedConsultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    ).populate("doctor user");

    if (!updatedConsultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    return res.status(200).json({
      message: "Consultation updated successfully",
      consultation: updatedConsultation,
    });
  } catch (error) {
    console.error("Update consultation error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete a consultation
router.delete("/:id", authUser, async (req, res) => {
  try {
    const deletedConsultation = await Consultation.findByIdAndDelete(
      req.params.id
    );

    if (!deletedConsultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    return res
      .status(200)
      .json({ message: "Consultation deleted successfully" });
  } catch (error) {
    console.error("Delete consultation error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
