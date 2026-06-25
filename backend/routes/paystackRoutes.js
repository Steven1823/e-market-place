import express from 'express';
import expressAsyncHandler from 'express-async-handler';

const paystackRouter = express.Router();

paystackRouter.post(
  '/initialize',
  expressAsyncHandler(async (req, res) => {
    const { email, amount, orderId } = req.body;
    if (!email || !amount || !orderId) {
      res.status(400).send({ message: 'email, amount and orderId are required' });
      return;
    }

    res.send({
      status: 'pending',
      authorizationUrl: `${process.env.PAYSTACK_PUBLIC_BASE_URL || 'https://checkout.paystack.com'}/placeholder-${orderId}`,
      reference: `PSTK-${Date.now()}`,
      orderId,
    });
  })
);

paystackRouter.get(
  '/verify/:reference',
  expressAsyncHandler(async (req, res) => {
    res.send({
      status: 'success',
      reference: req.params.reference,
      message: 'Paystack verification placeholder response',
    });
  })
);

export default paystackRouter;
