import mongoose from "mongoose";

const heldRoomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
    unique: true,
  },
  heldAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("HeldRoom", heldRoomSchema);
