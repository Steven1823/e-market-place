import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import { isAdmin, isAuth } from '../utils.js';

const orderRouter = express.Router();
const ORDER_STATUSES = [
  'Pending Payment',
  'Awaiting Confirmation',
  'Paid',
  'Processing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];
const fallbackOrders = [];

const enrichFallbackOrder = (order) => ({
  ...order,
  createdAt: order.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const getDefaultOrderStatus = (paymentMethod) =>
  paymentMethod === 'Bank Transfer' ? 'Awaiting Confirmation' : 'Pending Payment';

orderRouter.post(
  '/',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    let order;
    try {
      const newOrder = new Order({
        orderItems: req.body.orderItems.map((x) => ({ ...x, product: x._id })),
        shippingAddress: req.body.shippingAddress,
        paymentMethod: req.body.paymentMethod,
        paymentStatus: 'Pending',
        couponCode: req.body.couponCode || '',
        discountAmount: req.body.discountAmount || 0,
        itemsPrice: req.body.itemsPrice,
        shippingPrice: req.body.shippingPrice,
        taxPrice: req.body.taxPrice,
        totalPrice: req.body.totalPrice,
        orderStatus: getDefaultOrderStatus(req.body.paymentMethod),
        user: req.user._id,
      });
      order = await newOrder.save();
    } catch (err) {
      order = enrichFallbackOrder({
        _id: `ord-${Date.now()}`,
        orderItems: req.body.orderItems,
        shippingAddress: req.body.shippingAddress,
        paymentMethod: req.body.paymentMethod,
        paymentStatus: 'Pending',
        couponCode: req.body.couponCode || '',
        discountAmount: req.body.discountAmount || 0,
        itemsPrice: req.body.itemsPrice,
        shippingPrice: req.body.shippingPrice,
        taxPrice: req.body.taxPrice,
        totalPrice: req.body.totalPrice,
        user: req.user._id,
        isPaid: false,
        isDelivered: false,
        orderStatus: getDefaultOrderStatus(req.body.paymentMethod),
      });
      fallbackOrders.unshift(order);
    }
    res.status(201).send({ message: 'New Order Created', order });
  })
);

orderRouter.get(
  '/mine',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    let orders;
    try {
      orders = await Order.find({ user: req.user._id });
    } catch (err) {
      orders = fallbackOrders.filter(
        (order) => String(order.user) === String(req.user._id)
      );
    }
    res.send(orders);
  })
);

orderRouter.get(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { status, paymentMethod, fromDate, toDate } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }
    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.createdAt.$lte = new Date(toDate);
      }
    }

    let orders;
    try {
      orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .populate('user', 'name email');
    } catch (err) {
      orders = fallbackOrders;
      if (status && status !== 'all') {
        orders = orders.filter((order) => order.orderStatus === status);
      }
      if (paymentMethod && paymentMethod !== 'all') {
        orders = orders.filter((order) => order.paymentMethod === paymentMethod);
      }
    }
    res.send(orders);
  })
);

orderRouter.get(
  '/admin/summary',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    let orders;
    try {
      orders = await Order.find({});
    } catch (err) {
      orders = fallbackOrders;
    }
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const pendingOrders = orders.filter(
      (order) => order.orderStatus === 'Pending Payment' || order.orderStatus === 'Processing'
    ).length;

    res.send({
      totalSales,
      totalOrders: orders.length,
      pendingOrders,
    });
  })
);

orderRouter.post(
  '/track',
  expressAsyncHandler(async (req, res) => {
    const { orderNumber, email, phone } = req.body;
    const query = {};
    if (orderNumber) {
      query._id = orderNumber;
    }
    if (email) {
      query['shippingAddress.email'] = email;
    }
    if (phone) {
      query['shippingAddress.phone'] = phone;
    }

    let order;
    try {
      order = await Order.findOne(query);
    } catch (err) {
      order = fallbackOrders.find((candidate) => {
        const matchesOrder = orderNumber ? String(candidate._id) === String(orderNumber) : true;
        const matchesEmail = email
          ? candidate.shippingAddress?.email === email
          : true;
        const matchesPhone = phone
          ? candidate.shippingAddress?.phone === phone
          : true;
        return matchesOrder && matchesEmail && matchesPhone;
      });
    }
    if (!order) {
      res.status(404).send({ message: 'Order Not Found' });
      return;
    }

    res.send({
      _id: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      totalPrice: order.totalPrice,
      deliveryOption: order.shippingAddress.deliveryOption,
    });
  })
);

orderRouter.get(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    let order;
    try {
      order = await Order.findById(req.params.id);
    } catch (err) {
      order = fallbackOrders.find(
        (candidate) => String(candidate._id) === String(req.params.id)
      );
    }
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

orderRouter.put(
  '/:id/pay',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    let order;
    let usingFallback = false;
    try {
      order = await Order.findById(req.params.id);
    } catch (err) {
      usingFallback = true;
      order = fallbackOrders.find(
        (candidate) => String(candidate._id) === String(req.params.id)
      );
    }
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.orderStatus = 'Paid';
      order.paymentStatus = 'Success';
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = usingFallback ? enrichFallbackOrder(order) : await order.save();
      res.send({ message: 'Order Paid', order: updatedOrder });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

orderRouter.put(
  '/:id/status',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      res.status(400).send({ message: 'Invalid Order Status' });
      return;
    }
    let order;
    let usingFallback = false;
    try {
      order = await Order.findById(req.params.id);
    } catch (err) {
      usingFallback = true;
      order = fallbackOrders.find(
        (candidate) => String(candidate._id) === String(req.params.id)
      );
    }
    if (!order) {
      res.status(404).send({ message: 'Order Not Found' });
      return;
    }
    order.orderStatus = status;
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    if (status === 'Cancelled') {
      order.paymentStatus = order.isPaid ? order.paymentStatus : 'Failed';
    }
    const updatedOrder = usingFallback ? enrichFallbackOrder(order) : await order.save();
    res.send({ message: 'Order Status Updated', order: updatedOrder });
  })
);

export default orderRouter;
