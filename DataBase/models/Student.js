import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  regNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  applyDate: {
    type: Date,
    default: Date.now,
  },
  session: String,
  entityId: String,
  collegeName: String,
  wing: String,
  roomNo: String,
  bedNo: String,
  roomType: String,
  paymentFreq: String,
  startDate: String,
  endDate: String,
  remark: String,
  rejectRemark: String,
  status: {
    type: String,
    default: "pending", // pending, approved, rejected, assigned
  },
  hasReapplied: {
    type: Boolean,
    default: false,
  },
  history: [
    {
      action: String, // e.g., "Requested", "Edited", "Assigned", "Rejected"
      updatedAt: { type: Date, default: Date.now },
      wing: String,
      roomNo: String,
      bedNo: String,
      roomType: String,
      status: String,
      remark: String
    }
  ]
});

export default mongoose.model("StudentData", studentSchema);
