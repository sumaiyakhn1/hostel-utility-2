import express from "express";
import Student from "../models/Student.js";

const router = express.Router();

// GET all students
router.get("/", async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single student
router.get("/:regNumber", async (req, res) => {
    try {
        const student = await Student.findOne({ regNumber: req.params.regNumber });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/:regNumber", async (req, res) => {
    try {
        const regNumber = req.params.regNumber;

        if (!regNumber) {
            return res.status(400).json({ message: "regNumber required" });
        }

        // ✅ Pehle check karo
        const existing = await Student.findOne({ regNumber });
        if (existing) {
            return res.status(409).json({ message: "You are already registered!" });
        }

        // ✅ Tabhi save karo
        const student = new Student({ ...req.body, regNumber });
        await student.save();

        res.json({ message: "Data Saved Successfully", student });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update student (for Warden)
router.patch("/:regNumber", async (req, res) => {
    try {
        const existing = await Student.findOne({ regNumber: req.params.regNumber });
        if (!existing) {
            return res.status(404).json({ message: "Student not found." });
        }

        // 🔒 Once approved/assigned, status cannot be rolled back without explicit intent
        const lockedStatuses = ["approved", "assigned"];
        if (lockedStatuses.includes(existing.status)) {
            const incomingStatus = req.body.status;
            // Only allow: approved → assigned (ERP push), resetting to pending, or no status change at all
            const isAllowed =
                !incomingStatus ||
                (existing.status === "approved" && incomingStatus === "assigned") ||
                incomingStatus === "pending" ||
                incomingStatus === existing.status;

            if (!isAllowed) {
                return res.status(403).json({
                    message: `Cannot change status from '${existing.status}' to '${incomingStatus}'. Approval is final.`,
                });
            }
        }

        const student = await Student.findOneAndUpdate(
            { regNumber: req.params.regNumber },
            req.body,
            { new: true }
        );
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;