import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Rating from './Rating';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import axios from 'axios';
import { Store } from '../Store';
import { toast } from 'react-toastify';
import { formatCurrencyKES, getProductImage } from '../utils';

function Product(props) {
  const { product, onQuickView } = props;

  const { state, dispatch: cxtDispatch } = useContext(Store);
  const {
    cart: { cartItems },
    wishlist,
  } = state;

  const isWished = wishlist.find((x) => x._id === product._id);

  const addToCartHandler = async (item) => {
    const productKey = item._id || item.slug;
    const existItem = cartItems.find((x) => (x._id || x.slug) === productKey);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    let countInStock = item.countInStock;
    if (item._id) {
      const { data } = await axios.get(`/api/products/${item._id}`);
      countInStock = data.countInStock;
    }
    if (countInStock < quantity) {
      toast.error('Product is Out of Stock');
      return;
    }
    cxtDispatch({
      type: 'CART_ADD_ITEM',
      payload: { ...item, quantity },
    });
    toast.success('Added to cart');
  };

  const toggleWishlistHandler = () => {
    cxtDispatch({ type: 'WISHLIST_TOGGLE', payload: product });
    if (isWished) {
      toast.info('Removed from wishlist');
    } else {
      toast.success('Added to wishlist');
    }
  };

  const finalPrice =
    product.discountPrice > 0 && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;
  const discountPercent =
    finalPrice < product.price
      ? Math.round(((product.price - finalPrice) / product.price) * 100)
      : 0;

  return (
    <Card className="h-100 product-card">
      <Link to={`/product/${product.slug}`}>
        <img src={getProductImage(product.image)} className="card-img-top" alt={product.name} />
      </Link>

      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Link to={`/product/${product.slug}`}>
            <Card.Title>{product.name}</Card.Title>
          </Link>
          <Button variant="link" className="p-0 wishlist-btn" onClick={toggleWishlistHandler}>
            <i className={isWished ? 'fas fa-heart text-danger' : 'far fa-heart'}></i>
          </Button>
        </div>
        <div className="mb-2 d-flex gap-2 align-items-center flex-wrap">
          <Badge bg="light" text="dark">
            {product.category}
          </Badge>
          {finalPrice < product.price ? (
            <Badge bg="warning" text="dark">
              Sale -{discountPercent}%
            </Badge>
          ) : null}
          {product.rating >= 4.6 ? <Badge bg="danger">Hot</Badge> : null}
          {product.isBestSeller ? <Badge bg="dark">Best Seller</Badge> : null}
          {product.isNewArrival ? <Badge bg="success">New</Badge> : null}
          {product.countInStock > 0 && product.countInStock <= 5 ? (
            <Badge bg="danger">Limited Stock</Badge>
          ) : null}
        </div>
        <Rating rating={product.rating} numReviews={product.numReviews} />
        <Card.Text className="mb-2">
          <strong>{formatCurrencyKES(finalPrice)}</strong>{' '}
          {finalPrice < product.price ? (
            <span className="text-muted text-decoration-line-through">{formatCurrencyKES(product.price)}</span>
          ) : null}
        </Card.Text>
        <Card.Text className="text-muted small mb-3">{product.material || 'Premium Material'}</Card.Text>
        <div className="d-grid gap-2">
          <Button variant="outline-dark" onClick={() => onQuickView?.(product)}>
            Quick View
          </Button>
          {product.countInStock === 0 ? (
            <Button variant="light" disabled>
              Out of Stock
            </Button>
          ) : (
            <Button onClick={() => addToCartHandler(product)}>Add to Cart</Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
export default Product;
