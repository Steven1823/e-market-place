import { useEffect, useMemo, useReducer, useState } from 'react';
import axios from 'axios';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Product from '../components/product';
import { Helmet } from 'react-helmet-async';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Card from 'react-bootstrap/Card';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatCurrencyKES } from '../utils';
import data from '../data';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, products: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

function HomeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [{ loading, error, products }, dispatch] = useReducer(reducer, {
    products: [],
    loading: true,
    error: '',
  });
  const [categories, setCategories] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const search = queryParams.get('search') || '';
  const category = queryParams.get('category') || 'all';
  const size = queryParams.get('size') || 'all';
  const color = queryParams.get('color') || 'all';
  const sort = queryParams.get('sort') || 'popular';
  const min = queryParams.get('min') || '0';
  const max = queryParams.get('max') || '1000';
  const discount = queryParams.get('discount') || 'false';

  const updateFilter = (next) => {
    const params = new URLSearchParams(location.search);
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === 'all' || value === 'false') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    navigate(`/?${params.toString()}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const result = await axios.get('/api/products', {
          params: {
            search,
            category,
            size,
            color,
            sort,
            min,
            max,
            discount,
          },
        });
        if (!Array.isArray(result.data)) {
          throw new Error(
            'Products API is not configured. Set REACT_APP_API_URL to your backend domain.'
          );
        }
        dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
      } catch (err) {
        dispatch({ type: 'FETCH_SUCCESS', payload: data.products || [] });
      }
    };
    fetchData();

    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/products/categories/list');
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        setCategories(
          Array.from(
            new Set([
              ...(data.products || []).map((item) => item.category),
              'Men',
              'Women',
              'Kids',
              'Shoes',
              'Bags',
              'Accessories',
              'New Arrivals',
              'Best Sellers',
              'Sale',
            ])
          )
        );
      }
    };
    fetchCategories();
  }, [category, color, discount, max, min, search, size, sort]);

  useEffect(() => {
    if (!search) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get('/api/products/search/suggestions', {
          params: { q: search },
        });
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const safeProducts = Array.isArray(products) ? products : [];
  const newArrivals = safeProducts.filter((p) => p.isNewArrival).slice(0, 4);
  const bestSellers = safeProducts.filter((p) => p.isBestSeller).slice(0, 4);
  const saleProducts = safeProducts
    .filter((p) => p.discountPrice > 0 && p.discountPrice < p.price)
    .slice(0, 4);
  const mensFashion = safeProducts.filter((p) => p.category === 'Men').slice(0, 4);
  const womensFashion = safeProducts.filter((p) => p.category === 'Women').slice(0, 4);
  const kidsFashion = safeProducts.filter((p) => p.category === 'Kids').slice(0, 4);
  const categoryCards = [
    { title: 'Men', image: '/images/p1.jpg', subtitle: 'Smart casual, streetwear and workwear', filter: 'Men' },
    { title: 'Women', image: '/images/p2.jpg', subtitle: 'Elegant edits, dresses and premium basics', filter: 'Women' },
    { title: 'Shoes', image: '/images/p3.jpg', subtitle: 'Sneakers, formal shoes and lifestyle picks', filter: 'Shoes' },
    { title: 'Bags', image: '/images/p4.jpg', subtitle: 'Totes, handbags and everyday carry', filter: 'Bags' },
  ];

  return (
    <div>
      <Helmet>
        <title>Amazona Atelier</title>
      </Helmet>

      <section className="hero-section mb-4">
        <div className="hero-content">
          <p className="hero-kicker">Flash Fashion Kenya</p>
          <h1>Big Style Deals On Men, Women, Kids, Shoes and Bags</h1>
          <p>Shop trusted fashion picks with fast delivery across Kenya.</p>
          <div className="d-flex gap-2 flex-wrap">
            <Button onClick={() => updateFilter({ category: 'Sale' })}>Shop Flash Sale</Button>
            <Button variant="outline-light" onClick={() => updateFilter({ category: 'New Arrivals' })}>
              See New Arrivals
            </Button>
          </div>
        </div>
        <div className="hero-visual-grid">
          <img src="/images/p1.jpg" alt="Men collection" />
          <img src="/images/p2.jpg" alt="Women collection" />
          <img src="/images/p3.jpg" alt="Shoes collection" />
          <img src="/images/p4.jpg" alt="Bags collection" />
        </div>
      </section>

      <section className="category-gallery mb-4">
        <Row>
          {categoryCards.map((item) => (
            <Col key={item.title} md={3} sm={6} className="mb-3">
              <button
                type="button"
                className="category-card"
                onClick={() => updateFilter({ category: item.filter })}
              >
                <img src={item.image} alt={item.title} className="category-card-img" />
                <div className="category-card-copy">
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                </div>
              </button>
            </Col>
          ))}
        </Row>
      </section>

      <section className="mb-4">
        <h2 className="h5 mb-3">Shop by Category</h2>
        <div className="category-chips">
          {['Men', 'Women', 'Kids', 'Shoes', 'Bags', 'Accessories', 'New Arrivals', 'Best Sellers', 'Sale'].map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'dark' : 'outline-dark'}
              onClick={() => updateFilter({ category: cat })}
            >
              {cat}
            </Button>
          ))}
          <Button variant="outline-secondary" onClick={() => navigate('/')}>
            Reset
          </Button>
        </div>
      </section>

      <section className="filter-panel mb-4">
        <Row className="g-2 align-items-end">
          <Col md={2} sm={6}>
            <Form.Label>Category</Form.Label>
            <Form.Select value={category} onChange={(e) => updateFilter({ category: e.target.value })}>
              <option value="all">All</option>
              {[...new Set([...categories, 'Men', 'Women', 'Kids', 'Shoes', 'Bags', 'Accessories', 'New Arrivals', 'Best Sellers', 'Sale'])].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2} sm={6}>
            <Form.Label>Size</Form.Label>
            <Form.Select value={size} onChange={(e) => updateFilter({ size: e.target.value })}>
              <option value="all">All</option>
              {['XS', 'S', 'M', 'L', 'XL', '6Y', '8Y', '10Y', '40', '41', '42', '43', '44'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2} sm={6}>
            <Form.Label>Color</Form.Label>
            <Form.Select value={color} onChange={(e) => updateFilter({ color: e.target.value })}>
              <option value="all">All</option>
              {['Black', 'White', 'Navy', 'Cream', 'Gold', 'Olive', 'Khaki', 'Gray', 'Tan', 'Camel', 'Ivory', 'Red'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2} sm={6}>
            <Form.Label>Price Min</Form.Label>
            <Form.Control type="number" value={min} onChange={(e) => updateFilter({ min: e.target.value })} />
          </Col>
          <Col md={2} sm={6}>
            <Form.Label>Price Max</Form.Label>
            <Form.Control type="number" value={max} onChange={(e) => updateFilter({ max: e.target.value })} />
          </Col>
          <Col md={2} sm={6}>
            <Form.Label>Sort</Form.Label>
            <Form.Select value={sort} onChange={(e) => updateFilter({ sort: e.target.value })}>
              <option value="popular">Popularity</option>
              <option value="best-rated">Best Rated</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price Low to High</option>
              <option value="price-desc">Price High to Low</option>
            </Form.Select>
          </Col>
        </Row>
        <Form.Check
          className="mt-2"
          type="switch"
          id="discount-only"
          label="Show discounted items only"
          checked={discount === 'true'}
          onChange={(e) => updateFilter({ discount: e.target.checked ? 'true' : 'false' })}
        />
        {suggestions.length > 0 ? (
          <div className="search-suggestions mt-2">
            {suggestions.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => navigate(`/product/${item.slug}`)}
              >
                {item.name}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <h2 className="h5 mb-3">Featured Products</h2>
      <div className="products-grid">
        {loading ? (
          <LoadingBox />
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <Row>
            {safeProducts.map((product) => (
              <Col key={product.slug} sm={6} md={4} lg={3} className="mb-3">
                <Product product={product} onQuickView={setQuickViewProduct}></Product>
              </Col>
            ))}
          </Row>
        )}
      </div>

      <section className="mt-4">
        <h3 className="h5">New Arrivals</h3>
        <Row>
          {newArrivals.map((product) => (
            <Col key={product.slug} sm={6} md={3} className="mb-3">
              <Product product={product} onQuickView={setQuickViewProduct}></Product>
            </Col>
          ))}
        </Row>
      </section>

      <section className="mt-2">
        <h3 className="h5">Best Sellers</h3>
        <Row>
          {bestSellers.map((product) => (
            <Col key={product.slug} sm={6} md={3} className="mb-3">
              <Product product={product} onQuickView={setQuickViewProduct}></Product>
            </Col>
          ))}
        </Row>
      </section>

      <section className="mt-2">
        <h3 className="h5">Flash Sale</h3>
        <Row>
          {saleProducts.map((product) => (
            <Col key={product.slug} sm={6} md={3} className="mb-3">
              <Product product={product} onQuickView={setQuickViewProduct}></Product>
            </Col>
          ))}
        </Row>
      </section>

      <section className="promo-banner-row mt-4">
        <div className="promo-banner-card">
          <p className="promo-label">Marketplace Pick</p>
          <h3>Weekend Style Drops</h3>
          <p>Fresh premium looks curated for Nairobi, Mombasa, Kisumu and beyond.</p>
          <Button variant="dark" onClick={() => updateFilter({ category: 'Best Sellers' })}>
            Shop Best Sellers
          </Button>
        </div>
        <div className="promo-banner-card promo-banner-card--accent">
          <p className="promo-label">Pay With Ease</p>
          <h3>M-Pesa First Checkout</h3>
          <p>Fast checkout with M-Pesa, Paystack and bank transfer confirmation support.</p>
          <Button variant="light" onClick={() => navigate('/payment')}>
            View Payment Options
          </Button>
        </div>
      </section>

      <section className="mt-2">
        <h3 className="h5">Men&apos;s Fashion</h3>
        <Row>
          {mensFashion.map((product) => (
            <Col key={product.slug} sm={6} md={3} className="mb-3">
              <Product product={product} onQuickView={setQuickViewProduct}></Product>
            </Col>
          ))}
        </Row>
      </section>

      <section className="mt-2">
        <h3 className="h5">Women&apos;s Fashion</h3>
        <Row>
          {womensFashion.map((product) => (
            <Col key={product.slug} sm={6} md={3} className="mb-3">
              <Product product={product} onQuickView={setQuickViewProduct}></Product>
            </Col>
          ))}
        </Row>
      </section>

      <section className="mt-2">
        <h3 className="h5">Kids&apos; Fashion</h3>
        <Row>
          {kidsFashion.map((product) => (
            <Col key={product.slug} sm={6} md={3} className="mb-3">
              <Product product={product} onQuickView={setQuickViewProduct}></Product>
            </Col>
          ))}
        </Row>
      </section>

      <section className="info-strip mt-4">
        <div>
          <img src="/images/p1.jpg" alt="Men fashion" className="info-strip-img mb-2" />
          <h4>Men&apos;s Fashion</h4>
          <p>Streetwear, workwear and essentials curated for Kenyan style.</p>
        </div>
        <div>
          <img src="/images/p2.jpg" alt="Women fashion" className="info-strip-img mb-2" />
          <h4>Women&apos;s Fashion</h4>
          <p>Fresh arrivals, premium fits, and trend-forward wardrobe edits.</p>
        </div>
        <div>
          <img src="/images/p4.jpg" alt="Kids fashion" className="info-strip-img mb-2" />
          <h4>Kids&apos; Fashion</h4>
          <p>Comfortable quality clothing with fast doorstep delivery.</p>
        </div>
      </section>

      <section className="trust-badges mt-4">
        <div>Authentic Kenyan Fashion Sellers</div>
        <div>M-Pesa, Paystack & Secure Payments</div>
        <div>Fast Delivery Across Kenya</div>
        <div>Easy Returns & Support</div>
      </section>

      <section className="mt-4">
        <h3 className="h5">Customer Reviews</h3>
        <Row>
          <Col md={4} className="mb-3">
            <Card className="premium-card h-100">
              <Card.Body>
                <p className="mb-2">&quot;Delivery in Nairobi was super fast and the quality is amazing.&quot;</p>
                <small className="text-muted">Achieng, Nairobi</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="premium-card h-100">
              <Card.Body>
                <p className="mb-2">&quot;Loved the M-Pesa checkout. Simple and reliable.&quot;</p>
                <small className="text-muted">Kevin, Nakuru</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="premium-card h-100">
              <Card.Body>
                <p className="mb-2">&quot;Great style options for kids and very responsive support on WhatsApp.&quot;</p>
                <small className="text-muted">Faith, Mombasa</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>

      <section className="newsletter-box mt-4">
        <h3 className="h5 mb-2">Get Fashion Deals First</h3>
        <p className="text-muted mb-3">Join our newsletter for flash sales and new arrivals.</p>
        <div className="d-flex gap-2 flex-wrap">
          <Form.Control type="email" placeholder="Enter your email" className="newsletter-input" />
          <Button>Subscribe</Button>
        </div>
      </section>

      <Modal show={!!quickViewProduct} onHide={() => setQuickViewProduct(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Quick View</Modal.Title>
        </Modal.Header>
        {quickViewProduct ? (
          <Modal.Body>
            <img
              src={quickViewProduct.image || '/images/amazona.jpg'}
              alt={quickViewProduct.name}
              className="img-fluid rounded mb-3"
            />
            <h4>{quickViewProduct.name}</h4>
            <p className="text-muted mb-2">{quickViewProduct.category}</p>
            <p>{quickViewProduct.description}</p>
            <p className="mb-2">
              <strong>{formatCurrencyKES(quickViewProduct.discountPrice || quickViewProduct.price)}</strong>{' '}
              {quickViewProduct.discountPrice > 0 && quickViewProduct.discountPrice < quickViewProduct.price ? (
                <span className="text-muted text-decoration-line-through">{formatCurrencyKES(quickViewProduct.price)}</span>
              ) : null}
            </p>
            <Button onClick={() => navigate(`/product/${quickViewProduct.slug}`)}>
              View Full Product
            </Button>
          </Modal.Body>
        ) : null}
      </Modal>
    </div>
  );
}
export default HomeScreen;
