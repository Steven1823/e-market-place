import { useContext, useMemo, useState } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import MessageBox from '../components/MessageBox';
import { Store } from '../Store';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import axios from 'axios';
import Form from 'react-bootstrap/Form';
import { toast } from 'react-toastify';
import { formatCurrencyKES, getDeliveryFee, getProductImage } from '../utils';

export default function CartScreen() {
  const navigate = useNavigate();
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const {
    cart: { cartItems, coupon, shippingAddress },
  } = state;
  const [promoCode, setPromoCode] = useState(coupon?.code || '');

  const totals = useMemo(() => {
    const itemsPrice = cartItems.reduce(
      (a, c) => a + (c.discountPrice || c.price) * c.quantity,
      0
    );
    const hasDeliverySelection =
      Boolean(shippingAddress?.deliveryOption) || Boolean(shippingAddress?.county);
    const deliveryFee = hasDeliverySelection ? getDeliveryFee(shippingAddress || {}) : 0;
    const discount = coupon?.value || 0;
    const tax = (itemsPrice - discount) * 0.03;
    const total = itemsPrice + deliveryFee + tax - discount;
    return { itemsPrice, deliveryFee, discount, tax, total };
  }, [cartItems, coupon, shippingAddress]);

  const applyCouponHandler = () => {
    const coupons = {
      KENYA500: 500,
      JUMIA1000: 1000,
      FASHION1500: 1500,
    };
    const normalizedCode = promoCode.trim().toUpperCase();
    if (!normalizedCode) {
      toast.error('Enter a promo code');
      return;
    }
    if (!coupons[normalizedCode]) {
      toast.error('Invalid promo code');
      return;
    }
    cxtDispatch({
      type: 'CART_SAVE_COUPON',
      payload: { code: normalizedCode, value: coupons[normalizedCode] },
    });
    toast.success('Promo code applied');
  };

  const updateCartHandler = async (item, quantity) => {
    if (quantity < 1) {
      return;
    }
    const { data } = await axios.get(`/api/products/${item._id}`);
    if (data.countInStock < quantity) {
      toast.error('Product is Out of Stock');
      return;
    }
    cxtDispatch({
      type: 'CART_ADD_ITEM',
      payload: { ...item, quantity },
    });
  };
  const removeItemHandler = (item) => {
    cxtDispatch({ type: 'CART_REMOVE_ITEM', payload: item });
  };
  const checkOutHandler = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/signin?redirect=/shipping');
  };

  return (
    <div>
      <Helmet>
        <title>Shopping Cart</title>
      </Helmet>
      <h1>Shopping Cart</h1>
      <Row>
        <Col md={8}>
          {cartItems.length === 0 ? (
            <MessageBox>
              Cart is empty. <Link to="/">Continue shopping</Link>
            </MessageBox>
          ) : (
            <ListGroup>
              {cartItems.map((item, index) => (
                <ListGroup.Item key={`${item._id}-${item.selectedSize || ''}-${item.selectedColor || ''}-${index}`}>
                  <Row className="align-items-center">
                    <Col md={4}>
                      <img
                        src={getProductImage(item.image)}
                        alt={item.name}
                        className="img-fluid rounded img-thumbnail"
                      ></img>{' '}
                      <Link to={`/product/${item.slug}`}>{item.name}</Link>
                      <div className="small text-muted">
                        Size: {item.selectedSize || 'Standard'} | Color: {item.selectedColor || 'Default'}
                      </div>
                    </Col>
                    <Col md={3}>
                      <Button
                        onClick={() =>
                          updateCartHandler(item, item.quantity - 1)
                        }
                        variant="light"
                        disabled={item.quantity === 1}
                      >
                        <i className="fa fa-minus-circle"></i>
                      </Button>{' '}
                      <span>{item.quantity}</span>{' '}
                      <Button
                        variant="light"
                        onClick={() =>
                          updateCartHandler(item, item.quantity + 1)
                        }
                        disabled={item.quantity === item.countInStock}
                      >
                        <i className="fa fa-plus-circle"></i>
                      </Button>
                    </Col>
                    <Col md={3}>
                      {formatCurrencyKES(item.discountPrice || item.price)}
                    </Col>
                    <Col md={2}>
                      <Button
                        onClick={() => removeItemHandler(item)}
                        variant="light"
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
        <Col md={4}>
          <Card className="premium-card sticky-summary-card">
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <h3 className="h5">
                    Subtotal ({cartItems.reduce((a, c) => a + c.quantity, 0)} items)
                  </h3>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Form.Group>
                    <Form.Label>Coupon / Promo Code</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control
                        placeholder="KENYA500"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <Button variant="outline-dark" onClick={applyCouponHandler}>
                        Apply
                      </Button>
                    </div>
                  </Form.Group>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Items</Col>
                    <Col className="text-end">{formatCurrencyKES(totals.itemsPrice)}</Col>
                  </Row>
                  <Row>
                    <Col>Delivery Fee</Col>
                    <Col className="text-end">{formatCurrencyKES(totals.deliveryFee)}</Col>
                  </Row>
                  <Row>
                    <Col>Tax</Col>
                    <Col className="text-end">{formatCurrencyKES(totals.tax)}</Col>
                  </Row>
                  <Row>
                    <Col>Discount</Col>
                    <Col className="text-end text-success">-{formatCurrencyKES(totals.discount)}</Col>
                  </Row>
                  <Row className="fw-bold mt-2">
                    <Col>Total</Col>
                    <Col className="text-end">{formatCurrencyKES(totals.total)}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <div className="d-grid">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={checkOutHandler}
                      disabled={cartItems.length === 0}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
