import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import { Store } from '../Store';
import { toast } from 'react-toastify';
import { formatCurrencyKES, getError } from '../utils';

export default function AdminDashboardScreen() {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [summary, setSummary] = useState(null);
  const [inventory, setInventory] = useState({ inStock: 0, lowStock: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: summaryData }, { data: products }] = await Promise.all([
          axios.get('/api/orders/admin/summary', {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }),
          axios.get('/api/products?limit=200'),
        ]);
        setSummary(summaryData);
        const inStock = products.filter((p) => (p.stock ?? p.countInStock) > 0).length;
        const lowStock = products.filter((p) => (p.stock ?? p.countInStock) > 0 && (p.stock ?? p.countInStock) <= 5).length;
        setInventory({ inStock, lowStock });
      } catch (err) {
        toast.error(getError(err));
      }
    };
    if (userInfo?.isAdmin) {
      loadData();
    }
  }, [userInfo]);

  return (
    <div>
      <Helmet>
        <title>Admin Dashboard</title>
      </Helmet>
      <h1 className="h3 my-3">Admin Dashboard</h1>
      <Row>
        <Col md={3} sm={6} className="mb-3">
          <Card className="premium-card">
            <Card.Body>
              <Card.Subtitle className="text-muted">Total Sales</Card.Subtitle>
              <Card.Title>{formatCurrencyKES(summary ? summary.totalSales : 0)}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="premium-card">
            <Card.Body>
              <Card.Subtitle className="text-muted">Total Orders</Card.Subtitle>
              <Card.Title>{summary ? summary.totalOrders : 0}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="premium-card">
            <Card.Body>
              <Card.Subtitle className="text-muted">Pending Orders</Card.Subtitle>
              <Card.Title>{summary ? summary.pendingOrders : 0}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="premium-card">
            <Card.Body>
              <Card.Subtitle className="text-muted">Products In Stock</Card.Subtitle>
              <Card.Title>{inventory.inStock}</Card.Title>
              <small className="text-danger">Low stock: {inventory.lowStock}</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
