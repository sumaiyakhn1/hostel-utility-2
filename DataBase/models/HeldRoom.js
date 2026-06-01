import mongoose from "mongoose";

const heldRoomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
  },
  bedName: {
    type: String,
    required: true,
  },
  heldAt: {
    type: Date,
    default: Date.now,
  },
});

heldRoomSchema.index({ roomName: 1, bedName: 1 }, { unique: true });

export default mongoose.model("HeldRoom", heldRoomSchema);
