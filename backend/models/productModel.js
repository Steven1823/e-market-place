import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: 0 },
    countInStock: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    images: [{ type: String }],
    material: { type: String, default: 'Premium Cotton Blend' },
    deliveryEstimate: { type: String, default: '2-4 business days' },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    rating: { type: Number, required: true },
    numReviews: { type: Number, required: true },
    reviews: [
      {
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
