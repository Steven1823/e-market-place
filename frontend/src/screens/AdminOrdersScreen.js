import axios from 'axios';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import { Store } from '../Store';
import { formatCurrencyKES, getError } from '../utils';

const statuses = [
  'Pending Payment',
  'Awaiting Confirmation',
  'Paid',
  'Processing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export default function AdminOrdersScreen() {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', paymentMethod: 'all', fromDate: '', toDate: '' });

  const tokenHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${userInfo.token}` } }),
    [userInfo]
  );

  const loadOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.paymentMethod !== 'all') params.append('paymentMethod', filters.paymentMethod);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      const { data } = await axios.get(`/api/orders?${params.toString()}`, tokenHeader);
      setOrders(data);
    } catch (err) {
      toast.error(getError(err));
    }
  }, [filters, tokenHeader]);

  useEffect(() => {
    if (userInfo?.isAdmin) {
      loadOrders();
    }
  }, [loadOrders, userInfo]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/orders/${id}/status`, { status }, tokenHeader);
      toast.success('Order status updated');
      loadOrders();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div>
      <Helmet>
        <title>Admin Orders</title>
      </Helmet>
      <h1 className="h3 my-3">Order Management</h1>

      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <Form.Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="all">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Form.Select>
        </div>
        <div className="col-md-3">
          <Form.Select value={filters.paymentMethod} onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}>
            <option value="all">All Payment Methods</option>
            <option value="PayPal">PayPal</option>
            <option value="Paystack">Paystack</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="M-Pesa Daraja">M-Pesa Daraja</option>
          </Form.Select>
        </div>
        <div className="col-md-2">
          <Form.Control type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
        </div>
        <div className="col-md-2">
          <Form.Control type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
        </div>
        <div className="col-md-2">
          <Button className="w-100" onClick={loadOrders}>Apply</Button>
        </div>
      </div>

      <Table striped responsive hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order._id.slice(-8)}</td>
              <td>{order.user?.name || order.shippingAddress?.fullName}</td>
              <td>{formatCurrencyKES(order.totalPrice)}</td>
              <td>{order.paymentMethod}</td>
              <td>{order.orderStatus}</td>
              <td>
                <Form.Select
                  defaultValue={order.orderStatus}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Form.Select>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
