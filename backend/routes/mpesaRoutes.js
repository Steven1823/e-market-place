import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import { isAuth } from '../utils.js';

const mpesaRouter = express.Router();

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

mpesaRouter.post(
  '/stk-push',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { phone, amount, orderId } = req.body;
    if (!phone || !amount || !orderId) {
      res.status(400).send({ message: 'phone, amount and orderId are required' });
      return;
    }

    const normalizedPhone = String(phone).replace(/\s+/g, '');
    if (!/^\+?[0-9]{9,15}$/.test(normalizedPhone)) {
      res.status(400).send({ message: 'Invalid phone number format' });
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
        checkoutRequestId: `MPESA-${Date.now()}`,
        message: 'Order already paid',
        orderId,
      });
      return;
    }

    const shouldAutoConfirm = process.env.MPESA_MOCK_MODE !== 'false';
    if (shouldAutoConfirm) {
      await applyStockForPaidOrder(order);
      order.isPaid = true;
      order.paidAt = Date.now();
      order.orderStatus = 'Paid';
      order.paymentStatus = 'Success';
      order.paymentResult = {
        id: `MPESA-${Date.now()}`,
        status: 'success',
        update_time: new Date().toISOString(),
        email_address: order.shippingAddress?.email || req.user.email,
      };
      await order.save();

      res.send({
        status: 'success',
        checkoutRequestId: order.paymentResult.id,
        message: 'M-Pesa payment confirmed in mock mode. Order marked as paid.',
        orderId,
      });
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
