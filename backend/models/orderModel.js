import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderItems: [
      {
        slug: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      email: { type: String },
      phone: { type: String },
      address: { type: String, required: true },
      city: { type: String, required: true },
      county: { type: String },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      deliveryNotes: { type: String, default: '' },
      deliveryOption: {
        type: String,
        enum: ['Nairobi Delivery', 'Outside Nairobi Delivery', 'Pickup'],
        default: 'Nairobi Delivery',
      },
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Success', 'Failed'],
      default: 'Pending',
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    couponCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    orderStatus: {
      type: String,
      enum: [
        'Pending Payment',
        'Awaiting Confirmation',
        'Paid',
        'Processing',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
      ],
      default: 'Pending Payment',
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
