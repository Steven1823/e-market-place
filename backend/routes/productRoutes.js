import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import data from '../data.js';
import { isAdmin, isAuth } from '../utils.js';

const productRouter = express.Router();

const withTimeout = (promise, timeoutMs = 1200) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), timeoutMs);
    }),
  ]);

productRouter.get('/', async (req, res) => {
  const {
    category,
    min,
    max,
    size,
    color,
    search,
    sort,
    newest,
    discount,
    bestSeller,
    limit,
  } = req.query;

  const safeLimit = Number(limit) || 0;

  const buildFallbackProducts = () => {
    let products = [...data.products];

    if (category && category !== 'all') {
      products = products.filter((p) => p.category === category);
    }
    if (size && size !== 'all') {
      products = products.filter((p) => (p.sizes || []).includes(size));
    }
    if (color && color !== 'all') {
      products = products.filter((p) => (p.colors || []).includes(color));
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.category.toLowerCase().includes(lowerSearch)
      );
    }

    const minPrice = Number(min) || 0;
    const maxPrice = Number(max) || Number.MAX_SAFE_INTEGER;
    products = products.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    if (discount === 'true') {
      products = products.filter((p) => p.discountPrice && p.discountPrice < p.price);
    }
    if (bestSeller === 'true') {
      products = products.filter((p) => p.isBestSeller);
    }
    if (newest === 'true') {
      products = products.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    if (sort === 'newest') {
      products = products.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    if (sort === 'best-rated') {
      products = products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (sort === 'price-asc') {
      products = products.sort((a, b) => a.price - b.price);
    }
    if (sort === 'price-desc') {
      products = products.sort((a, b) => b.price - a.price);
    }
    if (sort === 'popular') {
      products = products.sort((a, b) => b.rating - a.rating);
    }

    if (safeLimit > 0) {
      return products.slice(0, safeLimit);
    }
    return products;
  };

  try {
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (size && size !== 'all') {
      filter.sizes = { $in: [size] };
    }
    if (color && color !== 'all') {
      filter.colors = { $in: [color] };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const minPrice = Number(min) || 0;
    const maxPrice = Number(max) || Number.MAX_SAFE_INTEGER;
    filter.price = { $gte: minPrice, $lte: maxPrice };

    if (discount === 'true') {
      filter.$expr = { $lt: ['$discountPrice', '$price'] };
    }
    if (bestSeller === 'true') {
      filter.isBestSeller = true;
    }

    let query = Product.find(filter);

    if (sort === 'newest') {
      query = query.sort({ createdAt: -1 });
    } else if (sort === 'best-rated') {
      query = query.sort({ rating: -1, numReviews: -1, createdAt: -1 });
    } else if (sort === 'price-asc') {
      query = query.sort({ price: 1 });
    } else if (sort === 'price-desc') {
      query = query.sort({ price: -1 });
    } else if (sort === 'popular') {
      query = query.sort({ rating: -1, numReviews: -1 });
    } else if (newest === 'true') {
      query = query.sort({ createdAt: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    if (safeLimit > 0) {
      query = query.limit(safeLimit);
    }

    const products = await withTimeout(query);
    res.send(products);
  } catch (err) {
    // Local fallback helps frontend run even if MongoDB is not available.
    res.send(buildFallbackProducts());
  }
});

productRouter.get(
  '/search/suggestions',
  expressAsyncHandler(async (req, res) => {
    const q = req.query.q || '';
    if (!q) {
      res.send([]);
      return;
    }

    try {
      const products = await withTimeout(
        Product.find({ name: { $regex: q, $options: 'i' } })
          .select('_id name slug image price discountPrice')
          .limit(8)
      );
      res.send(products);
    } catch (err) {
      const fallback = data.products
        .filter((p) => p.name.toLowerCase().includes(String(q).toLowerCase()))
        .slice(0, 8)
        .map((p) => ({
          _id: p._id,
          name: p.name,
          slug: p.slug,
          image: p.image,
          price: p.price,
          discountPrice: p.discountPrice,
        }));
      res.send(fallback);
    }
  })
);

productRouter.get(
  '/related/:slug',
  expressAsyncHandler(async (req, res) => {
    try {
      const product = await withTimeout(Product.findOne({ slug: req.params.slug }));
      if (!product) {
        res.send([]);
        return;
      }
      const related = await withTimeout(
        Product.find({
          category: product.category,
          slug: { $ne: product.slug },
        }).limit(8)
      );
      res.send(related);
    } catch (err) {
      const product = data.products.find((p) => p.slug === req.params.slug);
      if (!product) {
        res.send([]);
        return;
      }
      res.send(
        data.products
          .filter((p) => p.slug !== product.slug && p.category === product.category)
          .slice(0, 8)
      );
    }
  })
);

productRouter.get(
  '/categories/list',
  expressAsyncHandler(async (req, res) => {
    try {
      const categories = await withTimeout(Product.distinct('category'));
      res.send(categories);
    } catch (err) {
      res.send([...new Set(data.products.map((p) => p.category))]);
    }
  })
);

productRouter.get('/slug/:slug', async (req, res) => {
  let product;

  try {
    product = await withTimeout(Product.findOne({ slug: req.params.slug }));
  } catch (err) {
    product = data.products.find((p) => p.slug === req.params.slug);
  }

  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});
productRouter.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.send(product);
      return;
    }
  } catch (err) {
    // ignored to allow fallback
  }

  const product = data.products.find((p) => p._id === req.params.id);
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});

productRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const payload = {
      name: req.body.name || 'New Product',
      slug: req.body.slug || `new-product-${Date.now()}`,
      image: req.body.image || '/images/p1.jpg',
      images: req.body.images || [req.body.image || '/images/p1.jpg'],
      brand: req.body.brand || 'Amazona Couture',
      category: req.body.category || 'New Arrivals',
      description: req.body.description || 'Premium fashion piece.',
      price: req.body.price || 0,
      discountPrice: req.body.discountPrice || 0,
      countInStock: req.body.countInStock || 0,
      stock: req.body.stock || req.body.countInStock || 0,
      sizes: req.body.sizes || ['S', 'M', 'L'],
      colors: req.body.colors || ['Black'],
      material: req.body.material || 'Premium Cotton Blend',
      deliveryEstimate: req.body.deliveryEstimate || '2-4 business days',
      rating: req.body.rating || 0,
      numReviews: req.body.numReviews || 0,
      isBestSeller: Boolean(req.body.isBestSeller),
      isNewArrival: Boolean(req.body.isNewArrival),
      isOnSale: Boolean(req.body.isOnSale),
    };

    let createdProduct;
    try {
      const product = new Product(payload);
      createdProduct = await product.save();
    } catch (err) {
      createdProduct = { _id: `p${Date.now()}`, ...payload };
      data.products.unshift(createdProduct);
    }
    res.status(201).send({ message: 'Product Created', product: createdProduct });
  })
);

productRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    let product;
    let usingFallback = false;
    try {
      product = await Product.findById(req.params.id);
    } catch (err) {
      usingFallback = true;
      product = data.products.find(
        (candidate) => String(candidate._id) === String(req.params.id)
      );
    }
    if (!product) {
      res.status(404).send({ message: 'Product Not Found' });
      return;
    }
    product.name = req.body.name || product.name;
    product.slug = req.body.slug || product.slug;
    product.image = req.body.image || product.image;
    product.images = req.body.images || product.images;
    product.brand = req.body.brand || product.brand;
    product.category = req.body.category || product.category;
    product.description = req.body.description || product.description;
    product.price = req.body.price ?? product.price;
    product.discountPrice = req.body.discountPrice ?? product.discountPrice;
    product.countInStock = req.body.countInStock ?? product.countInStock;
    product.stock = req.body.stock ?? product.stock;
    product.sizes = req.body.sizes || product.sizes;
    product.colors = req.body.colors || product.colors;
    product.material = req.body.material || product.material;
    product.deliveryEstimate = req.body.deliveryEstimate || product.deliveryEstimate;
    product.isBestSeller = req.body.isBestSeller ?? product.isBestSeller;
    product.isNewArrival = req.body.isNewArrival ?? product.isNewArrival;
    product.isOnSale = req.body.isOnSale ?? product.isOnSale;
    const updatedProduct = usingFallback ? product : await product.save();
    res.send({ message: 'Product Updated', product: updatedProduct });
  })
);

productRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(404).send({ message: 'Product Not Found' });
        return;
      }
      await product.deleteOne();
    } catch (err) {
      const index = data.products.findIndex(
        (candidate) => String(candidate._id) === String(req.params.id)
      );
      if (index === -1) {
        res.status(404).send({ message: 'Product Not Found' });
        return;
      }
      data.products.splice(index, 1);
    }
    res.send({ message: 'Product Deleted' });
  })
);

export default productRouter;
