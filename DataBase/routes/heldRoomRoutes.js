import express from "express";
import HeldRoom from "../models/HeldRoom.js";

const router = express.Router();

// GET all held rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await HeldRoom.find().sort({ heldAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST hold a room
router.post("/", async (req, res) => {
  try {
    const { roomName } = req.body;
    if (!roomName) {
      return res.status(400).json({ message: "roomName is required." });
    }

    const existing = await HeldRoom.findOne({ roomName });
    if (existing) {
      return res.status(409).json({ message: "Room is already on hold." });
    }

    const held = new HeldRoom({ roomName });
    await held.save();
    res.json({ message: "Room held successfully.", held });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE unhold a room
router.delete("/:roomName", async (req, res) => {
  try {
    const result = await HeldRoom.findOneAndDelete({
      roomName: req.params.roomName,
    });
    if (!result) {
      return res.status(404).json({ message: "Room not found in hold list." });
    }
    res.json({ message: "Room unhold successful." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
