// controllers/paymentController.js
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import mpesaService from '../services/mpesaService.js';

export const paymentController = {
  // Initiate M-Pesa payment
  initiatePayment: async (req, res) => {
    try {
      const { bookingId, phoneNumber } = req.body;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const payment = new Payment({
        booking: bookingId,
        amount: booking.tickets.totalAmount,
        phoneNumber: phoneNumber.replace(/^0/, '254')
      });

      await payment.save();

      const mpesaResponse = await mpesaService.stkPush({
        phoneNumber: payment.phoneNumber,
        amount: payment.amount,
        reference: booking.bookingId,
        description: `Payment for ${booking.bookingId}`
      });

      payment.checkoutRequestId = mpesaResponse.CheckoutRequestID;
      payment.merchantRequestId = mpesaResponse.MerchantRequestID;
      payment.status = 'pending';
      await payment.save();

      res.json({
        success: true,
        message: 'Payment initiated successfully',
        data: { paymentId: payment._id, checkoutRequestId: mpesaResponse.CheckoutRequestID }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error initiating payment', error: error.message });
    }
  },

  // Check payment status
  checkPaymentStatus: async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.paymentId)
        .populate({ path: 'booking', populate: { path: 'event' } });

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      res.json({ success: true, data: payment });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error checking payment status', error: error.message });
    }
  },

  // M-Pesa callback handler
  mpesaCallback: async (req, res) => {
    try {
      const { Body } = req.body;
      const { stkCallback } = Body;

      const checkoutRequestId = stkCallback.CheckoutRequestID;
      const resultCode = stkCallback.ResultCode;
      const resultDesc = stkCallback.ResultDesc;

      const payment = await Payment.findOne({ checkoutRequestId });
      if (!payment) {
        console.log('Payment not found for CheckoutRequestID:', checkoutRequestId);
        return res.status(200).json({ status: 'ok' });
      }

      payment.resultCode = resultCode;
      payment.resultDesc = resultDesc;

      if (resultCode === 0) {
        const items = stkCallback.CallbackMetadata.Item;
        const mpesaReceiptNumber = items.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
        const transactionDate = items.find(item => item.Name === 'TransactionDate')?.Value;

        payment.status = 'completed';
        payment.mpesaReceiptNumber = mpesaReceiptNumber;
        payment.transactionDate = new Date(transactionDate);

        const booking = await Booking.findById(payment.booking);
        booking.payment.status = 'paid';
        booking.payment.transactionId = mpesaReceiptNumber;
        booking.payment.paymentDate = payment.transactionDate;
        await booking.save();
      } else {
        payment.status = 'failed';

        const booking = await Booking.findById(payment.booking);
        const event = await Event.findById(booking.event);
        event.availableTickets += booking.tickets.quantity;
        await event.save();
      }

      await payment.save();
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('M-Pesa callback error:', error);
      res.status(200).json({ status: 'ok' });
    }
  }
};
