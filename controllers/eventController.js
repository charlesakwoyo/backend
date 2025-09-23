// controllers/eventController.js
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';

export const eventController = {
  // Get all events
  getAllEvents: async (req, res) => {
    try {
      const { category, date, location, page = 1, limit = 10 } = req.query;
      const filter = { status: 'active' };

      if (category) filter.category = category;
      if (location) filter.location = new RegExp(location, 'i');
      if (date) {
        const searchDate = new Date(date);
        filter.date = {
          $gte: searchDate,
          $lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000)
        };
      }

      const events = await Event.find(filter)
        .sort({ date: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Event.countDocuments(filter);

      res.json({
        success: true,
        data: events,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching events',
        error: error.message
      });
    }
  },

  // Get single event
  getEvent: async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      res.json({ success: true, data: event });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching event',
        error: error.message
      });
    }
  },

  // Create event
  createEvent: async (req, res) => {
    try {
      const eventData = req.body;
      eventData.availableTickets = eventData.capacity;

      const event = new Event(eventData);
      await event.save();

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: event
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creating event',
        error: error.message
      });
    }
  },

  // Update event
  updateEvent: async (req, res) => {
    try {
      const event = await Event.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      res.json({
        success: true,
        message: 'Event updated successfully',
        data: event
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error updating event',
        error: error.message
      });
    }
  },

  // Delete event
  deleteEvent: async (req, res) => {
    try {
      const event = await Event.findByIdAndDelete(req.params.id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting event',
        error: error.message
      });
    }
  }
};
