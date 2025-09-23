// models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      default: function () {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substr(2, 5);
        return `BK${timestamp}${random}`.toUpperCase();
      },
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    customerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    tickets: {
      quantity: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
    },
    payment: {
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      mpesaTransactionId: String,
      paymentDate: Date,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "used"],
      default: "active",
    },
    qrCode: String,
    bookingDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
