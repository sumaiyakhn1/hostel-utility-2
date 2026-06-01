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
    const { roomName, bedName } = req.body;
    if (!roomName || !bedName) {
      return res.status(400).json({ message: "roomName and bedName are required." });
    }

    const existing = await HeldRoom.findOne({ roomName, bedName });
    if (existing) {
      return res.status(409).json({ message: "Bed is already on hold." });
    }

    const held = new HeldRoom({ roomName, bedName });
    await held.save();
    res.json({ message: "Bed held successfully.", held });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE unhold a room
router.delete("/:roomName/:bedName", async (req, res) => {
  try {
    const result = await HeldRoom.findOneAndDelete({
      roomName: req.params.roomName,
      bedName: req.params.bedName,
    });
    if (!result) {
      return res.status(404).json({ message: "Bed not found in hold list." });
    }
    res.json({ message: "Bed unhold successful." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
