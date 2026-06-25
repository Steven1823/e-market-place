import { useContext } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import MessageBox from '../components/MessageBox';
import { formatCurrencyKES } from '../utils';

export default function WishlistScreen() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { wishlist } = state;

  const removeHandler = (item) => {
    ctxDispatch({ type: 'WISHLIST_TOGGLE', payload: item });
  };

  return (
    <div>
      <Helmet>
        <title>Wishlist</title>
      </Helmet>
      <h1 className="mb-3">My Wishlist</h1>
      {wishlist.length === 0 ? (
        <MessageBox>
          Your wishlist is empty. <Link to="/">Continue shopping</Link>
        </MessageBox>
      ) : (
        <Row>
          {wishlist.map((item) => (
            <Col key={item._id} sm={6} lg={4} className="mb-3">
              <Card className="h-100 product-card">
                <Link to={`/product/${item.slug}`}>
                  <Card.Img variant="top" src={item.image} alt={item.name} />
                </Link>
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{item.name}</Card.Title>
                  <Card.Text className="mb-1">{formatCurrencyKES(item.discountPrice || item.price)}</Card.Text>
                  {item.discountPrice > 0 && item.discountPrice < item.price ? (
                    <Card.Text className="text-muted text-decoration-line-through">{formatCurrencyKES(item.price)}</Card.Text>
                  ) : null}
                  <div className="mt-auto d-flex gap-2">
                    <Button variant="primary" onClick={() => navigate(`/product/${item.slug}`)}>
                      View Product
                    </Button>
                    <Button variant="outline-dark" onClick={() => removeHandler(item)}>
                      Remove
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
