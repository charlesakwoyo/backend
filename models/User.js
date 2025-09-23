// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, 
    role: { type: String, enum: ["admin", "employee", "attendee"], default: "attendee" },
    provider: { type: String, enum: ["local", "google", "facebook"], default: "local" },
    phone: { type: String }, 
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
