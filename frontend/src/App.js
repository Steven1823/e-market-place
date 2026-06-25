import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomeScreen from './screens/HomeScreen';
import ProductScreen from './screens/ProductScreen';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Badge from 'react-bootstrap/Badge';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import { LinkContainer } from 'react-router-bootstrap';
import { useContext, useEffect, useState } from 'react';
import { Store } from './Store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CartScreen from './screens/CartScreen';
import SigninScreen from './screens/SigninScreen';
import ShippingAddressScreen from './screens/ShippingAddressScreen';
import SignupScreen from './screens/SignupScreen';
import PaymentMethodScreen from './screens/PaymentMethodScreen';
import PlaceOrderScreen from './screens/PlaceOrderScreen';
import OrderScreen from './screens/OrderScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import WishlistScreen from './screens/WishlistScreen';
import OrderSuccessScreen from './screens/OrderSuccessScreen';
import OrderTrackingScreen from './screens/OrderTrackingScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminProductsScreen from './screens/AdminProductsScreen';
import AdminOrdersScreen from './screens/AdminOrdersScreen';

function App() {
  const whatsappNumber = '254702319387';
  const whatsappHref = `https://wa.me/${whatsappNumber}`;
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo, wishlist } = state;
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('search') || '');
  }, [location.search]);

  const submitSearchHandler = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    navigate(`/?${params.toString()}`);
  };

  const signoutHandler = () => {
    ctxDispatch({ type: 'USER_SIGNOUT' });
    localStorage.removeItem('userInfo');
    localStorage.removeItem('shippingAddress');
    localStorage.removeItem('paymentMethod');
    window.location.href = '/signin';
  };

  return (
    <div className="d-flex flex-column site-container premium-bg">
      <ToastContainer position="bottom-center" limit={2} />
      <header>
        <div className="top-mini-bar">
          <Container className="d-flex justify-content-between">
            <span>Fast delivery across Kenya | Pay with M-Pesa | WhatsApp support</span>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="topbar-whatsapp-link">
              254702319387
            </a>
          </Container>
        </div>
        <Navbar className="premium-nav" expand="lg" sticky="top">
          <Container>
            <LinkContainer to="/">
              <Navbar.Brand className="brand-name">Amazona Atelier</Navbar.Brand>
            </LinkContainer>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Form className="search-form me-auto" onSubmit={submitSearchHandler}>
                <Form.Control
                  type="search"
                  placeholder="Search premium fashion..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Form>
              <Nav className="ms-auto align-items-center gap-2">
                <Link to="/wishlist" className="nav-link">
                  Wishlist
                  {wishlist.length > 0 ? (
                    <Badge pill bg="warning" text="dark" className="ms-1">
                      {wishlist.length}
                    </Badge>
                  ) : null}
                </Link>
                <Link to="/cart" className="nav-link sticky-cart-link">
                  Cart
                  {cart.cartItems.length > 0 ? (
                    <Badge pill bg="danger" className="ms-1">
                      {cart.cartItems.reduce((a, c) => a + c.quantity, 0)}
                    </Badge>
                  ) : null}
                </Link>
                <Link to="/track-order" className="nav-link">
                  Track Order
                </Link>
                {userInfo ? (
                  <NavDropdown title={userInfo.name} id="basic-nav-dropdown" align="end">
                    <LinkContainer to="/profile">
                      <NavDropdown.Item>User Profile</NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to="/orderhistory">
                      <NavDropdown.Item>Order History</NavDropdown.Item>
                    </LinkContainer>
                    {userInfo.isAdmin ? (
                      <>
                        <NavDropdown.Divider />
                        <LinkContainer to="/admin/dashboard">
                          <NavDropdown.Item>Admin Dashboard</NavDropdown.Item>
                        </LinkContainer>
                        <LinkContainer to="/admin/products">
                          <NavDropdown.Item>Manage Products</NavDropdown.Item>
                        </LinkContainer>
                        <LinkContainer to="/admin/orders">
                          <NavDropdown.Item>Manage Orders</NavDropdown.Item>
                        </LinkContainer>
                      </>
                    ) : null}
                    <NavDropdown.Divider />
                    <Link className="dropdown-item" to="#signout" onClick={signoutHandler}>
                      Sign Out
                    </Link>
                  </NavDropdown>
                ) : (
                  <Link className="nav-link" to="/signin">
                    Sign In
                  </Link>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>

      <main>
        <Container className="mt-3 mb-4">
          <Routes>
            <Route path="/product/:slug" element={<ProductScreen />} />
            <Route path="/cart" element={<CartScreen />} />
            <Route path="/wishlist" element={<WishlistScreen />} />
            <Route path="/signin" element={<SigninScreen />} />
            <Route path="/signup" element={<SignupScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/placeorder" element={<PlaceOrderScreen />} />
            <Route path="/order/:id" element={<OrderScreen />} />
            <Route path="/order-success/:id" element={<OrderSuccessScreen />} />
            <Route path="/orderhistory" element={<OrderHistoryScreen />} />
            <Route path="/track-order" element={<OrderTrackingScreen />} />
            <Route path="/shipping" element={<ShippingAddressScreen />} />
            <Route path="/payment" element={<PaymentMethodScreen />} />
            <Route path="/admin/dashboard" element={<AdminDashboardScreen />} />
            <Route path="/admin/products" element={<AdminProductsScreen />} />
            <Route path="/admin/orders" element={<AdminOrdersScreen />} />
            <Route path="/" element={<HomeScreen />} />
          </Routes>
        </Container>
      </main>
      <footer className="premium-footer text-center">
        <Container>
          <p className="mb-1">Amazona Atelier. Crafted for modern wardrobes.</p>
          <small>
            WhatsApp: 254702319387 | Email: support@amazona.co.ke | Policies | Nairobi, Kenya
          </small>
        </Container>
      </footer>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="floating-whatsapp-btn"
        aria-label="Chat on WhatsApp"
      >
        <i className="fab fa-whatsapp"></i>
      </a>
      <Link to="/cart" className="floating-cart-btn" aria-label="Open cart">
        <i className="fas fa-shopping-cart"></i>
        {cart.cartItems.length > 0 ? (
          <span className="floating-cart-badge">
            {cart.cartItems.reduce((a, c) => a + c.quantity, 0)}
          </span>
        ) : null}
      </Link>
      <nav className="mobile-bottom-nav d-md-none">
        <Link to="/" className="mobile-nav-link">Home</Link>
        <Link to="/wishlist" className="mobile-nav-link">Wishlist</Link>
        <Link to="/cart" className="mobile-nav-link">Cart</Link>
        <Link to="/track-order" className="mobile-nav-link">Track</Link>
        <Link to={userInfo ? '/profile' : '/signin'} className="mobile-nav-link">Account</Link>
      </nav>
    </div>
  );
}

export default function WrappedApp() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
