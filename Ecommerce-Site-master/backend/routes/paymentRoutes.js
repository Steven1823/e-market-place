import express from 'express';
import expressAsyncHandler from 'express-async-handler';

const paymentRouter = express.Router();

paymentRouter.post(
  '/mpesa/stk-push',
  expressAsyncHandler(async (req, res) => {
    const { phone, amount, orderId } = req.body;

    if (!phone || !amount || !orderId) {
      res.status(400).send({ message: 'phone, amount, and orderId are required' });
      return;
    }

    // Placeholder endpoint for M-Pesa STK push integration.
    res.send({
      status: 'pending',
      paymentMethod: 'M-Pesa',
      checkoutRequestId: `MPESA-${Date.now()}`,
      message: 'STK push initiated. Complete payment on your phone.',
      orderId,
    });
  })
);

paymentRouter.post(
  '/paystack/initialize',
  expressAsyncHandler(async (req, res) => {
    const { email, amount, orderId } = req.body;

    if (!email || !amount || !orderId) {
      res.status(400).send({ message: 'email, amount, and orderId are required' });
      return;
    }

    // Placeholder endpoint for Paystack initialize.
    res.send({
      status: 'pending',
      paymentMethod: 'Paystack',
      authorizationUrl: `${process.env.PAYSTACK_PUBLIC_BASE_URL || 'https://checkout.paystack.com'}/placeholder-${orderId}`,
      reference: `PSTK-${Date.now()}`,
      orderId,
    });
  })
);

paymentRouter.post(
  '/paystack/verify',
  expressAsyncHandler(async (req, res) => {
    const { reference, orderId } = req.body;

    if (!reference || !orderId) {
      res.status(400).send({ message: 'reference and orderId are required' });
      return;
    }

    // Placeholder endpoint for Paystack verification.
    res.send({
      status: 'success',
      paymentMethod: 'Paystack',
      reference,
      orderId,
      message: 'Payment verified (placeholder).',
    });
  })
);

export default paymentRouter;
