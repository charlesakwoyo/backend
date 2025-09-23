// routes/eventRoutes.js
import express from 'express';
import { eventController } from '../controllers/eventController.js';

const router = express.Router();

// Event routes
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEvent);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

export default router;
