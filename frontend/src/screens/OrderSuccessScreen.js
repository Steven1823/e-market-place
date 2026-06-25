import { Helmet } from 'react-helmet-async';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function OrderSuccessScreen() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <Card className="premium-card small-container mx-auto text-center py-4">
      <Helmet>
        <title>Order Success</title>
      </Helmet>
      <Card.Body>
        <h1 className="h3 mb-3">Order Successfully Placed</h1>
        <p className="text-muted mb-1">Order Number</p>
        <p className="fw-bold mb-4">{id}</p>
        <p className="text-muted mb-4">
          We have received your order. You can track it using your order number or phone number,
          and payment confirmation will update automatically for M-Pesa, Paystack, or manual transfer.
        </p>
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <Button onClick={() => navigate(`/order/${id}`)}>View Order</Button>
          <Button variant="outline-dark" onClick={() => navigate('/track-order')}>
            Track Order
          </Button>
          <Button variant="outline-secondary" as={Link} to="/">
            Continue Shopping
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
