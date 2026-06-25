import axios from 'axios';
import { useContext, useEffect, useReducer, useState } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { useNavigate, useParams } from 'react-router-dom';
import ListGroup from 'react-bootstrap/ListGroup';
import Rating from '../components/Rating';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { Helmet } from 'react-helmet-async';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { formatCurrencyKES, getError } from '../utils';
import { Store } from '../Store';
import Product from '../components/product';
import { toast } from 'react-toastify';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, product: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

function ProductScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { slug } = params;

  const [{ loading, error, product }, dispatch] = useReducer(reducer, {
    product: [],
    loading: true,
    error: '',
  });
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [showZoom, setShowZoom] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const [result, related] = await Promise.all([
          axios.get(`/api/products/slug/${slug}`),
          axios.get(`/api/products/related/${slug}`),
        ]);
        dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
        setRelatedProducts(related.data || []);
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
      }
    };
    fetchData();
  }, [slug]);

  useEffect(() => {
    if (product?.sizes?.length) {
      setSelectedSize(product.sizes[0]);
    }
    if (product?.colors?.length) {
      setSelectedColor(product.colors[0]);
    }
    if (product?.images?.length) {
      setSelectedImage(product.images[0]);
    } else if (product?.image) {
      setSelectedImage(product.image);
    }
  }, [product]);

  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { cart } = state;
  const addToCartHandler = async () => {
    const existItem = cart.cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${product._id}`);
    if (data.countInStock < quantity) {
      toast.error('Product is Out of Stock');
      return;
    }
    cxtDispatch({
      type: 'CART_ADD_ITEM',
      payload: {
        ...product,
        quantity,
        selectedSize,
        selectedColor,
      },
    });
    toast.success('Added to cart');
    navigate('/cart');
  };

  const activePrice =
    product.discountPrice > 0 && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

  return loading ? (
    <LoadingBox />
  ) : error ? (
    <MessageBox variant="danger">{error}</MessageBox>
  ) : (
    <div>
      <Row>
        <Col md={6}>
          <img
            className="img-large"
            src={selectedImage || product.image}
            alt={product.name}
            onClick={() => setShowZoom(true)}
          ></img>
          <div className="d-flex gap-2 mt-2 flex-wrap">
            {(product.images?.length ? product.images : [product.image]).map((img) => (
              <img
                key={img}
                src={img}
                alt={product.name}
                className={`img-thumbnail thumb ${selectedImage === img ? 'active' : ''}`}
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        </Col>
        <Col md={3}>
          <ListGroup variants="flush">
            <ListGroup.Item>
              <Helmet>
                <title>{product.name}</title>
              </Helmet>
            </ListGroup.Item>
            <ListGroup.Item>
              <Rating
                rating={product.rating}
                numReviews={product.numReviews}
              ></Rating>
            </ListGroup.Item>
            <ListGroup.Item>
              Price: <strong>{formatCurrencyKES(activePrice)}</strong>{' '}
              {activePrice < product.price ? (
                <span className="text-muted text-decoration-line-through">{formatCurrencyKES(product.price)}</span>
              ) : null}
            </ListGroup.Item>
            <ListGroup.Item>
              Material: <strong>{product.material || 'Premium Fabric'}</strong>
            </ListGroup.Item>
            <ListGroup.Item>
              Delivery: <strong>{product.deliveryEstimate || '2-4 business days'}</strong>
            </ListGroup.Item>
            <ListGroup.Item>
              <Form.Group>
                <Form.Label>Size</Form.Label>
                <Form.Select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  {(product.sizes || ['Standard']).map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </ListGroup.Item>
            <ListGroup.Item>
              <Form.Group>
                <Form.Label>Color</Form.Label>
                <Form.Select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                >
                  {(product.colors || ['Default']).map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </ListGroup.Item>
            <ListGroup.Item>
              Description:
              <p>{product.description}</p>
            </ListGroup.Item>
            <ListGroup.Item>
              <h5 className="mb-2">Size Guide</h5>
              <small className="text-muted">
                Tops: S(36), M(38), L(40), XL(42) | Shoes: use your regular EU size.
              </small>
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Row>
                    <Col>Price:</Col>
                    <Col>{formatCurrencyKES(activePrice)}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Status:</Col>
                    <Col>
                      {product.countInStock > 0 ? (
                        <Badge bg="success">In Stock</Badge>
                      ) : (
                        <Badge bg="danger">Out of Stock</Badge>
                      )}
                    </Col>
                  </Row>
                </ListGroup.Item>

                {product.countInStock > 0 && (
                  <ListGroup.Item>
                    <div className="d-grid">
                      <Button onClick={addToCartHandler} variant="primary">
                        Add to Cart
                      </Button>
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="mt-4">
        <h3 className="h5">Reviews & Ratings</h3>
        {(product.reviews || []).length === 0 ? (
          <p className="text-muted">No reviews yet.</p>
        ) : (
          <ListGroup>
            {product.reviews.map((review, index) => (
              <ListGroup.Item key={`${review.name}-${index}`}>
                <strong>{review.name}</strong> - {review.rating}/5
                <p className="mb-0 text-muted">{review.comment}</p>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>

      <div className="mt-4">
        <h3 className="h5">Related Products</h3>
        <Row>
          {relatedProducts.slice(0, 4).map((item) => (
            <Col key={item.slug} sm={6} md={3} className="mb-3">
              <Product product={item} />
            </Col>
          ))}
        </Row>
      </div>

      <div className="mt-2">
        <h3 className="h5">You May Also Like</h3>
        <Row>
          {relatedProducts.slice(4, 8).map((item) => (
            <Col key={item.slug} sm={6} md={3} className="mb-3">
              <Product product={item} />
            </Col>
          ))}
        </Row>
      </div>

      <Modal show={showZoom} onHide={() => setShowZoom(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{product.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <img src={selectedImage || product.image} alt={product.name} className="img-fluid" />
        </Modal.Body>
      </Modal>
    </div>
  );
}
export default ProductScreen;
