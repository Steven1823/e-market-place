import axios from 'axios';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { toast } from 'react-toastify';
import { formatCurrencyKES, getError } from '../utils';

export default function OrderTrackingScreen() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!orderNumber && !email && !phone) {
      toast.error('Enter order number, email, or phone to track your order.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post('/api/orders/track', {
        orderNumber,
        email,
        phone,
      });
      setTracking(data);
    } catch (err) {
      toast.error(getError(err));
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="small-container">
      <Helmet>
        <title>Track Order</title>
      </Helmet>
      <h1 className="h3 my-3">Track Your Order</h1>
      <Card className="premium-card mb-3">
        <Card.Body>
          <Form onSubmit={submitHandler}>
            <Form.Group className="mb-3" controlId="orderNumber">
              <Form.Label>Order Number</Form.Label>
              <Form.Control value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="phone">
              <Form.Label>Phone</Form.Label>
              <Form.Control value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Form.Group>
            <Button type="submit" disabled={loading}>
              {loading ? 'Tracking...' : 'Track Order'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {tracking ? (
        <Card className="premium-card">
          <Card.Body>
            <h2 className="h5">Order {tracking._id}</h2>
            <p className="mb-1">Status: <strong>{tracking.orderStatus}</strong></p>
            <p className="mb-1">Payment: <strong>{tracking.paymentStatus}</strong></p>
            <p className="mb-1">Delivery Option: <strong>{tracking.deliveryOption || 'Nairobi Delivery'}</strong></p>
            <p className="mb-0">Total: <strong>{formatCurrencyKES(tracking.totalPrice || 0)}</strong></p>
          </Card.Body>
        </Card>
      ) : null}
    </div>
  );
}
