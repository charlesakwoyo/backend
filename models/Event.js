import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  capacity: { type: Number, required: true, min: 1 },
  availableTickets: { type: Number }, // Not required, pre-save hook will set
  category: {
    type: String,
    enum: ['music', 'sports', 'conference', 'workshop', 'other'],
    default: 'other'
  },
  organizer: {
    name: String,
    contact: String,
    email: String
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active'
  },
  image: String,
  tags: [String]
}, { timestamps: true });

// Pre-save hook: initialize availableTickets
eventSchema.pre('save', function(next) {
  if (this.isNew && (this.availableTickets == null)) {
    this.availableTickets = this.capacity;
  }
  next();
});

// Virtual for sold tickets
eventSchema.virtual('soldTickets').get(function() {
  return this.capacity - this.availableTickets;
});

// Update available tickets when booking is made
eventSchema.methods.bookTickets = function(quantity) {
  if (this.availableTickets >= quantity) {
    this.availableTickets -= quantity;
    return this.save();
  }
  throw new Error('Not enough tickets available');
};

export default mongoose.model('Event', eventSchema);
