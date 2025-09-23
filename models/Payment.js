// models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  mpesaRequestId: String,
  checkoutRequestId: String,
  merchantRequestId: String,
  mpesaReceiptNumber: String,
  transactionDate: Date,
  status: {
    type: String,
    enum: ['initiated', 'pending', 'completed', 'failed', 'cancelled'],
    default: 'initiated'
  },
  resultCode: String,
  resultDesc: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);
