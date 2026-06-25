import axios from 'axios';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import { toast } from 'react-toastify';
import { Store } from '../Store';
import { formatCurrencyKES, getError } from '../utils';

const initialForm = {
  _id: '',
  name: '',
  slug: '',
  category: 'New Arrivals',
  brand: 'Amazona Couture',
  image: '/images/p1.jpg',
  images: '/images/p1.jpg, /images/p2.jpg',
  price: 0,
  discountPrice: 0,
  countInStock: 0,
  sizes: 'S,M,L',
  colors: 'Black',
  material: 'Premium Cotton Blend',
  deliveryEstimate: '2-4 business days',
  isBestSeller: false,
  isNewArrival: true,
  isOnSale: false,
  description: 'Premium fashion product',
};

const categoryOptions = [
  'Men',
  'Women',
  'Kids',
  'Shoes',
  'Bags',
  'Accessories',
  'New Arrivals',
  'Sale',
  'Best Sellers',
];

export default function AdminProductsScreen() {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);

  const tokenHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${userInfo.token}` } }),
    [userInfo]
  );

  const loadProducts = async () => {
    try {
      const { data } = await axios.get('/api/products?limit=500');
      setProducts(data);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  useEffect(() => {
    if (userInfo?.isAdmin) {
      loadProducts();
    }
  }, [userInfo]);

  const openCreate = () => {
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setForm({
      ...initialForm,
      ...product,
      images: (product.images || []).join(', '),
      sizes: (product.sizes || []).join(','),
      colors: (product.colors || []).join(','),
    });
    setShowModal(true);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      images: form.images.split(',').map((x) => x.trim()).filter(Boolean),
      sizes: form.sizes.split(',').map((x) => x.trim()).filter(Boolean),
      colors: form.colors.split(',').map((x) => x.trim()).filter(Boolean),
      price: Number(form.price),
      discountPrice: Number(form.discountPrice),
      countInStock: Number(form.countInStock),
      stock: Number(form.countInStock),
    };

    try {
      if (form._id) {
        await axios.put(`/api/products/${form._id}`, payload, tokenHeader);
        toast.success('Product updated');
      } else {
        await axios.post('/api/products', payload, tokenHeader);
        toast.success('Product created');
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const deleteHandler = async (id) => {
    try {
      await axios.delete(`/api/products/${id}`, tokenHeader);
      toast.success('Product deleted');
      loadProducts();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div>
      <Helmet>
        <title>Admin Products</title>
      </Helmet>
      <div className="d-flex justify-content-between align-items-center my-3">
        <h1 className="h3 m-0">Product Management</h1>
        <Button onClick={openCreate}>Add Product</Button>
      </div>

      <Table striped responsive hover className="align-middle">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id || product.slug}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{formatCurrencyKES(product.discountPrice > 0 ? product.discountPrice : product.price)}</td>
              <td>{product.stock ?? product.countInStock}</td>
              <td className="d-flex gap-2">
                <Button size="sm" variant="outline-dark" onClick={() => openEdit(product)}>
                  Edit
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => deleteHandler(product._id)} disabled={!product._id}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{form._id ? 'Edit Product' : 'Add Product'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitHandler}>
          <Modal.Body>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Label>Name</Form.Label>
                <Form.Control required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="col-md-6">
                <Form.Label>Slug</Form.Label>
                <Form.Control required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="col-md-6">
                <Form.Label>Category</Form.Label>
                <Form.Select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-6">
                <Form.Label>Brand</Form.Label>
                <Form.Control required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div className="col-md-4">
                <Form.Label>Price</Form.Label>
                <Form.Control type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="col-md-4">
                <Form.Label>Discount Price</Form.Label>
                <Form.Control type="number" min="0" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
              </div>
              <div className="col-md-4">
                <Form.Label>Stock</Form.Label>
                <Form.Control type="number" min="0" value={form.countInStock} onChange={(e) => setForm({ ...form, countInStock: e.target.value })} />
              </div>
              <div className="col-md-6">
                <Form.Label>Main Image</Form.Label>
                <Form.Control value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                <small className="text-muted d-block mt-1">Paste an image URL or use a public image path.</small>
              </div>
              <div className="col-md-6">
                <Form.Label>Multiple Images (comma separated)</Form.Label>
                <Form.Control value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} />
              </div>
              <div className="col-12">
                <div className="d-flex gap-2 flex-wrap">
                  {(form.images ? form.images.split(',') : [form.image])
                    .map((image) => image.trim())
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((image) => (
                      <img
                        key={image}
                        src={image}
                        alt="Preview"
                        className="img-thumbnail thumb"
                      />
                    ))}
                </div>
              </div>
              <div className="col-md-6">
                <Form.Label>Sizes (comma separated)</Form.Label>
                <Form.Control value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} />
              </div>
              <div className="col-md-6">
                <Form.Label>Colors (comma separated)</Form.Label>
                <Form.Control value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} />
              </div>
              <div className="col-md-6">
                <Form.Label>Material</Form.Label>
                <Form.Control value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
              </div>
              <div className="col-md-6">
                <Form.Label>Delivery Estimate</Form.Label>
                <Form.Control value={form.deliveryEstimate} onChange={(e) => setForm({ ...form, deliveryEstimate: e.target.value })} />
              </div>
              <div className="col-12">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="col-md-4">
                <Form.Check label="Best Seller" checked={!!form.isBestSeller} onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })} />
              </div>
              <div className="col-md-4">
                <Form.Check label="New Arrival" checked={!!form.isNewArrival} onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })} />
              </div>
              <div className="col-md-4">
                <Form.Check label="On Sale" checked={!!form.isOnSale} onChange={(e) => setForm({ ...form, isOnSale: e.target.checked })} />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
