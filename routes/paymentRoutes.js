import express from 'express';
import { paymentController } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/initiate', paymentController.initiatePayment);
router.get('/:paymentId', paymentController.checkPaymentStatus);
router.post('/mpesa/callback', paymentController.mpesaCallback);

export default router;
