import express from 'express';
import expressAsyncHandler from 'express-async-handler';

const mpesaRouter = express.Router();

mpesaRouter.post(
  '/stk-push',
  expressAsyncHandler(async (req, res) => {
    const { phone, amount, orderId } = req.body;
    if (!phone || !amount || !orderId) {
      res.status(400).send({ message: 'phone, amount and orderId are required' });
      return;
    }

    // Placeholder Daraja STK push response. Real integration should use env vars only.
    res.send({
      status: 'pending',
      checkoutRequestId: `MPESA-${Date.now()}`,
      message: 'STK push initiated. Please complete payment on your phone.',
      orderId,
    });
  })
);

mpesaRouter.post(
  '/callback',
  expressAsyncHandler(async (req, res) => {
    res.send({ message: 'M-Pesa callback received', payload: req.body });
  })
);

mpesaRouter.post(
  '/query-status',
  expressAsyncHandler(async (req, res) => {
    const { checkoutRequestId } = req.body;
    res.send({
      checkoutRequestId,
      status: 'pending',
      message: 'Payment status query placeholder response',
    });
  })
);

export default mpesaRouter;
