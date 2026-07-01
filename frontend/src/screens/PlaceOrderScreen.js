import Axios from 'axios';
import React, { useContext, useEffect, useReducer } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import { Store } from '../Store';
import CheckoutSteps from '../components/CheckoutSteps';
import { toast } from 'react-toastify';
import { formatCurrencyKES, getDeliveryFee, getError, getProductImage } from '../utils';
import LoadingBox from '../components/LoadingBox';
import Form from 'react-bootstrap/Form';
import MessageBox from '../components/MessageBox';

const reducer = (state, action) => {
  switch (action.type) {
    case 'CREATE_REQUEST':
      return { ...state, loading: true };
    case 'CREATE_SUCCESS':
      return { ...state, loading: false };
    case 'CREATE_FAIL':
      return { ...state, loading: false };
    default:
      return state;
  }
};

export default function PlaceOrderScreen() {
  const navigate = useNavigate();

  const [{ loading }, dispatch] = useReducer(reducer, {
    loading: false,
  });
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo } = state;

  const [mpesaPhone, setMpesaPhone] = React.useState(
    cart.shippingAddress.phone || ''
  );
  const [paymentState, setPaymentState] = React.useState({
    status: '',
    message: '',
  });
  const [bankReference, setBankReference] = React.useState('');

  const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100; // 123.2345 => 123.23
  cart.itemsPrice = round2(
    cart.cartItems.reduce(
      (a, c) => a + c.quantity * (c.discountPrice || c.price),
      0
    )
  );
  cart.shippingPrice = round2(getDeliveryFee(cart.shippingAddress || {}));
  cart.taxPrice = round2(0.03 * cart.itemsPrice);
  cart.discountAmount = round2(cart.coupon?.value || 0);
  cart.totalPrice =
    cart.itemsPrice + cart.shippingPrice + cart.taxPrice - cart.discountAmount;

  const createOrder = async () => {
    const { data } = await Axios.post(
      '/api/orders',
      {
        orderItems: cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod: cart.paymentMethod,
        couponCode: cart.coupon?.code || '',
        discountAmount: cart.discountAmount,
        itemsPrice: cart.itemsPrice,
        shippingPrice: cart.shippingPrice,
        taxPrice: cart.taxPrice,
        totalPrice: cart.totalPrice,
      },
      {
        headers: {
          authorization: `Bearer ${userInfo.token}`,
        },
      }
    );
    return data.order;
  };

  const placeOrderHandler = async () => {
    try {
      dispatch({ type: 'CREATE_REQUEST' });

      if (cart.cartItems.length === 0) {
        toast.error('Cart is empty');
        dispatch({ type: 'CREATE_FAIL' });
        return;
      }

      const outOfStockItem = cart.cartItems.find(
        (item) => item.quantity > item.countInStock
      );
      if (outOfStockItem) {
        toast.error(`${outOfStockItem.name} is out of stock`);
        dispatch({ type: 'CREATE_FAIL' });
        return;
      }

      if (cart.paymentMethod === 'Bank Transfer' && !bankReference.trim()) {
        toast.error('Enter your bank transaction code/reference');
        dispatch({ type: 'CREATE_FAIL' });
        return;
      }

      const order = await createOrder();

      if (cart.paymentMethod === 'M-Pesa Daraja') {
        const { data } = await Axios.post('/api/mpesa/stk-push', {
          phone: mpesaPhone,
          amount: cart.totalPrice,
          orderId: order._id,
        }, {
          headers: {
            authorization: `Bearer ${userInfo.token}`,
          },
        });
        const isPaid = data.status === 'success';
        setPaymentState({
          status: isPaid ? 'success' : 'pending',
          message: data.message,
        });
        toast[isPaid ? 'success' : 'info'](
          isPaid
            ? 'Payment confirmed and order completed.'
            : 'M-Pesa STK push sent. Complete payment on your Safaricom line.'
        );
      }

      if (cart.paymentMethod === 'Paystack') {
        const { data } = await Axios.post('/api/paystack/initialize', {
          email: cart.shippingAddress.email || userInfo.email,
          amount: cart.totalPrice,
          orderId: order._id,
        }, {
          headers: {
            authorization: `Bearer ${userInfo.token}`,
          },
        });
        const isPaid = data.status === 'success';
        if (!isPaid && data.authorizationUrl) {
          window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer');
        }
        setPaymentState({
          status: isPaid ? 'success' : 'pending',
          message: isPaid
            ? data.message
            : 'Redirecting to Paystack secure checkout...',
        });
      }

      if (cart.paymentMethod === 'Bank Transfer') {
        setPaymentState({
          status: 'pending',
          message: `Bank transfer submitted with reference: ${bankReference || 'N/A'}. Awaiting confirmation.`,
        });
      }

      localStorage.setItem(
        'lastTrackedOrder',
        JSON.stringify({
          _id: order._id,
          orderStatus:
            cart.paymentMethod === 'Bank Transfer'
              ? 'Awaiting Confirmation'
              : 'Pending Payment',
          paymentStatus:
            cart.paymentMethod === 'Bank Transfer' ? 'Pending Confirmation' : 'Pending',
          createdAt: new Date().toISOString(),
          totalPrice: cart.totalPrice,
          deliveryOption: cart.shippingAddress.deliveryOption,
          email: cart.shippingAddress.email,
          phone: cart.shippingAddress.phone,
        })
      );

      ctxDispatch({ type: 'CART_CLEAR' });
      dispatch({ type: 'CREATE_SUCCESS' });
      localStorage.removeItem('cartItems');
      navigate(`/order-success/${order._id}`);
    } catch (err) {
      dispatch({ type: 'CREATE_FAIL' });
      toast.error(getError(err));
    }
  };

  useEffect(() => {
    if (!cart.paymentMethod) {
      navigate('/payment');
    }
  }, [cart, navigate]);

  return (
    <div>
      <CheckoutSteps step1 step2 step3 step4></CheckoutSteps>
      <Helmet>
        <title>Preview Order</title>
      </Helmet>
      <h1 className="my-3">Preview Order</h1>
      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Shipping</Card.Title>
              <Card.Text>
                <strong>Name:</strong> {cart.shippingAddress.fullName} <br />
                <strong>Email:</strong> {cart.shippingAddress.email} <br />
                <strong>Phone:</strong> {cart.shippingAddress.phone} <br />
                <strong>Address: </strong> {cart.shippingAddress.address},
                {cart.shippingAddress.city}, {cart.shippingAddress.county},{' '}
                {cart.shippingAddress.postalCode}, {cart.shippingAddress.country}
                <br />
                <strong>Delivery Option:</strong>{' '}
                {cart.shippingAddress.deliveryOption || 'Standard Delivery'}
              </Card.Text>
              <Link to="/shipping">Edit</Link>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Payment</Card.Title>
              <Card.Text>
                <strong>Method:</strong> {cart.paymentMethod}
              </Card.Text>
              <Link to="/payment">Edit</Link>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Items</Card.Title>
              <ListGroup variant="flush">
                {cart.cartItems.map((item) => (
                  <ListGroup.Item key={item._id}>
                    <Row className="align-items-center">
                      <Col md={6}>
                        <img
                          src={getProductImage(item.image)}
                          alt={item.name}
                          className="img-fluid rounded img-thumbnail"
                        ></img>{' '}
                        <Link to={`/product/${item.slug}`}>{item.name}</Link>
                      </Col>
                      <Col md={3}>
                        <span>{item.quantity}</span>
                      </Col>
                      <Col md={3}>{formatCurrencyKES(item.discountPrice || item.price)}</Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Link to="/cart">Edit</Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Order Summary</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Row>
                    <Col>Items</Col>
                    <Col>{formatCurrencyKES(cart.itemsPrice)}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Shipping</Col>
                    <Col>{formatCurrencyKES(cart.shippingPrice)}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Tax</Col>
                    <Col>{formatCurrencyKES(cart.taxPrice)}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Discount</Col>
                    <Col>-{formatCurrencyKES(cart.discountAmount)}</Col>
                  </Row>
                </ListGroup.Item>
                {cart.paymentMethod === 'M-Pesa Daraja' ? (
                  <ListGroup.Item>
                    <Form.Group controlId="mpesaPhone">
                      <Form.Label>Safaricom M-Pesa Phone Number</Form.Label>
                      <Form.Control
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        required
                        pattern="^\+?[0-9]{9,15}$"
                      />
                    </Form.Group>
                  </ListGroup.Item>
                ) : null}
                {cart.paymentMethod === 'Bank Transfer' ? (
                  <ListGroup.Item>
                    <p className="mb-2">
                      <strong>Bank:</strong> Equity Bank<br />
                      <strong>Account Name:</strong> Amazona Fashion KE<br />
                      <strong>Account Number:</strong> 0123456789012
                    </p>
                    <Form.Group controlId="bankReference">
                      <Form.Label>Transaction Code / Payment Reference</Form.Label>
                      <Form.Control
                        value={bankReference}
                        onChange={(e) => setBankReference(e.target.value)}
                        placeholder="Enter bank transfer reference"
                        required
                      />
                    </Form.Group>
                  </ListGroup.Item>
                ) : null}
                <ListGroup.Item>
                  <Row>
                    <Col>
                      <strong> Order Total</strong>
                    </Col>
                    <Col>
                      <strong>{formatCurrencyKES(cart.totalPrice)}</strong>
                    </Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <div className="d-grid">
                    <Button
                      type="button"
                      onClick={placeOrderHandler}
                      disabled={cart.cartItems.length === 0}
                    >
                      Place Order
                    </Button>
                  </div>
                  {loading && <LoadingBox></LoadingBox>}
                  {paymentState.status ? (
                    <MessageBox
                      variant={
                        paymentState.status === 'failed'
                          ? 'danger'
                          : paymentState.status === 'pending'
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {paymentState.message}
                    </MessageBox>
                  ) : null}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
