import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import mpesaService from "../services/mpesaService.js";

// Helper to normalize phone numbers
const normalizePhone = (phone) => {
  if (!phone) return "";
  phone = phone.replace(/\D/g, ""); 
  if (phone.startsWith("0")) return "254" + phone.slice(1);
  if (phone.startsWith("254")) return phone;
  return phone;
};

export const bookingController = {
  createBooking: async (req, res) => {
    try {
      console.log("Incoming booking request:", req.body);
      const { eventId, customerInfo, ticketQuantity } = req.body;

      if (!customerInfo?.name || !customerInfo?.email || !customerInfo?.phone) {
        return res.status(400).json({ success: false, message: "Customer name, email, and phone are required" });
      }

      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: "Event not found" });
      if (event.availableTickets < ticketQuantity)
        return res.status(400).json({ success: false, message: `Not enough tickets. Requested ${ticketQuantity}, only ${event.availableTickets} left.` });

      const unitPrice = event.price;
      const totalAmount = unitPrice * ticketQuantity;

      const booking = new Booking({
        event: eventId,
        customerInfo,
        tickets: { quantity: ticketQuantity, unitPrice, totalAmount },
      });

      await booking.save();
      console.log("Booking saved with ID:", booking.bookingId);

      event.availableTickets -= ticketQuantity;
      await event.save();

      try {
        const stkResponse = await mpesaService.stkPush({
          phoneNumber: normalizePhone(customerInfo.phone),
          amount: totalAmount,
          reference: booking.bookingId,
          description: `Payment for booking ${booking.bookingId}`,
        });

        console.log("STK Push response:", stkResponse);

        booking.payment.mpesaTransactionId = stkResponse.CheckoutRequestID || null;
        booking.payment.status = "pending";
        await booking.save();
      } catch (stkError) {
        console.error("STK Push failed:", stkError.response?.data || stkError.message);
        return res.status(201).json({
          success: true,
          message: "Booking saved, but STK Push failed. Retry payment.",
          data: booking,
        });
      }

      res.status(201).json({
        success: true,
        message: "Booking successful! Complete payment via STK Push.",
        data: booking,
      });
    } catch (error) {
      console.error("Error creating booking:", error.message);
      res.status(400).json({ success: false, message: "Error creating booking", error: error.message });
    }
  },

  getBooking: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id).populate("event");
      if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
      res.json({ success: true, data: booking });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching booking", error: error.message });
    }
  },

  getBookingsByCustomer: async (req, res) => {
    try {
      const { phone, email } = req.query;
      const filter = {};
      if (phone) filter["customerInfo.phone"] = normalizePhone(phone);
      if (email) filter["customerInfo.email"] = email;
      const bookings = await Booking.find(filter).populate("event").sort({ createdAt: -1 });
      res.json({ success: true, data: bookings });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching bookings", error: error.message });
    }
  },

  cancelBooking: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

      if (booking.payment?.status === "paid")
        return res.status(400).json({ success: false, message: "Cannot cancel paid booking. Request refund." });

      booking.status = "cancelled";
      await booking.save();

      const event = await Event.findById(booking.event);
      if (event) {
        event.availableTickets += booking.tickets.quantity;
        await event.save();
      }

      res.json({ success: true, message: "Booking cancelled successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error cancelling booking", error: error.message });
    }
  },
};
