import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import { isAuth } from '../utils.js';

const paystackRouter = express.Router();

const applyStockForPaidOrder = async (order) => {
  for (const item of order.orderItems) {
    const quantity = Number(item.quantity || 0);
    if (quantity < 1) {
      continue;
    }
    const product = await Product.findById(item.product);
    if (!product) {
      throw new Error(`${item.name || 'Product'} no longer exists`);
    }
    if (product.countInStock < quantity) {
      throw new Error(`${item.name || product.name} is out of stock`);
    }
    product.countInStock -= quantity;
    if (typeof product.stock === 'number') {
      product.stock = Math.max(0, product.stock - quantity);
    }
    await product.save();
  }
};

paystackRouter.post(
  '/initialize',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { email, amount, orderId } = req.body;
    if (!email || !amount || !orderId) {
      res.status(400).send({ message: 'email, amount and orderId are required' });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).send({ message: 'Order not found' });
      return;
    }
    if (String(order.user) !== String(req.user._id) && !req.user.isAdmin) {
      res.status(403).send({ message: 'Not allowed to pay this order' });
      return;
    }

    if (order.isPaid) {
      res.send({
        status: 'success',
        authorizationUrl: '',
        reference: order.paymentResult?.id || `PSTK-${Date.now()}`,
        orderId,
        message: 'Order already paid',
      });
      return;
    }

    const shouldAutoConfirm = process.env.PAYSTACK_MOCK_MODE !== 'false';
    if (shouldAutoConfirm) {
      await applyStockForPaidOrder(order);
      order.isPaid = true;
      order.paidAt = Date.now();
      order.orderStatus = 'Paid';
      order.paymentStatus = 'Success';
      order.paymentResult = {
        id: `PSTK-${Date.now()}`,
        status: 'success',
        update_time: new Date().toISOString(),
        email_address: email,
      };
      await order.save();
      res.send({
        status: 'success',
        authorizationUrl: '',
        reference: order.paymentResult.id,
        orderId,
        message: 'Paystack payment confirmed in mock mode. Order marked as paid.',
      });
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
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { orderId } = req.query;
    if (!orderId) {
      res.status(400).send({ message: 'orderId query param is required' });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).send({ message: 'Order not found' });
      return;
    }
    if (String(order.user) !== String(req.user._id) && !req.user.isAdmin) {
      res.status(403).send({ message: 'Not allowed to verify this order' });
      return;
    }

    if (!order.isPaid) {
      await applyStockForPaidOrder(order);
      order.isPaid = true;
      order.paidAt = Date.now();
      order.orderStatus = 'Paid';
      order.paymentStatus = 'Success';
      order.paymentResult = {
        id: req.params.reference,
        status: 'success',
        update_time: new Date().toISOString(),
        email_address: order.shippingAddress?.email || req.user.email,
      };
      await order.save();
    }

    res.send({
      status: 'success',
      reference: req.params.reference,
      message: 'Payment verified and order marked as paid',
    });
  })
);

export default paystackRouter;
