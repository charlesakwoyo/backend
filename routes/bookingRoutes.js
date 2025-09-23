// bookingRoutes.js
import express from 'express';
import { bookingController } from '../controllers/bookingController.js';

const bookingRouter = express.Router();

bookingRouter.post('/', bookingController.createBooking);
bookingRouter.get('/customer', bookingController.getBookingsByCustomer);
bookingRouter.get('/:id', bookingController.getBooking);
bookingRouter.put('/:id/cancel', bookingController.cancelBooking);

export default bookingRouter;
