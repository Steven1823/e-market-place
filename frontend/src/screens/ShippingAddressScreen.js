import React, { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import CheckoutSteps from '../components/CheckoutSteps';
import { KENYA_COUNTIES } from '../utils';

export default function ShippingAddressScreen() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    userInfo,
    cart: { shippingAddress },
  } = state;
  const [fullName, setFullName] = useState(shippingAddress.fullName || '');
  const [email, setEmail] = useState(shippingAddress.email || userInfo?.email || '');
  const [phone, setPhone] = useState(shippingAddress.phone || '');
  const [address, setAddress] = useState(shippingAddress.address || '');
  const [city, setCity] = useState(shippingAddress.city || '');
  const [county, setCounty] = useState(shippingAddress.county || 'Nairobi');
  const [postalCode, setPostalCode] = useState(
    shippingAddress.postalCode || ''
  );
  const [deliveryNotes, setDeliveryNotes] = useState(shippingAddress.deliveryNotes || '');
  const [deliveryOption, setDeliveryOption] = useState(
    shippingAddress.deliveryOption || shippingAddress.county || 'Nairobi'
  );
  useEffect(() => {
    if (!userInfo) {
      navigate('/signin?redirect=/shipping');
    }
  }, [userInfo, navigate]);
  const [country, setCountry] = useState(shippingAddress.country || 'Kenya');
  const submitHandler = (e) => {
    e.preventDefault();
    if (!/^\+?[0-9]{9,15}$/.test(phone.trim())) {
      return;
    }
    ctxDispatch({
      type: 'SAVE_SHIPPING_ADDRESS',
      payload: {
        fullName,
        email,
        phone,
        address,
        city,
        county,
        postalCode,
        country,
        deliveryNotes,
        deliveryOption,
      },
    });
    localStorage.setItem(
      'shippingAddress',
      JSON.stringify({
        fullName,
        email,
        phone,
        address,
        city,
        county,
        postalCode,
        country,
        deliveryNotes,
        deliveryOption,
      })
    );
    navigate('/payment');
  };
  return (
    <div>
      <Helmet>
        <title>Shipping Address</title>
      </Helmet>

      <CheckoutSteps step1 step2></CheckoutSteps>
      <div className="container small-container">
        <h1 className="my-3">Shipping Address</h1>
        <Form onSubmit={submitHandler}>
          <Form.Group className="mb-3" controlId="fullName">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="phone">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              pattern="^\+?[0-9]{9,15}$"
              title="Enter a valid phone number"
              placeholder="2547XXXXXXXX"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="address">
            <Form.Label>Exact Delivery Address</Form.Label>
            <Form.Control
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="House, apartment, building, street"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="city">
            <Form.Label>Town / Estate</Form.Label>
            <Form.Control
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              placeholder="Westlands, Syokimau, Nyali, Milimani..."
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="county">
            <Form.Label>County</Form.Label>
            <Form.Select
              value={county}
              onChange={(e) => {
                const selectedCounty = e.target.value;
                setCounty(selectedCounty);
                if (deliveryOption !== 'Pickup') {
                  setDeliveryOption(selectedCounty);
                }
              }}
              required
            >
              {KENYA_COUNTIES.map((countyName) => (
                <option key={countyName} value={countyName}>
                  {countyName}
                </option>
              ))}
              <option value="Other">Other County</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="postalCode">
            <Form.Label>Postal Code</Form.Label>
            <Form.Control
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="country">
            <Form.Label>Country</Form.Label>
            <Form.Control
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="deliveryOption">
            <Form.Label>Delivery Option</Form.Label>
            <Form.Select
              value={deliveryOption}
              onChange={(e) => setDeliveryOption(e.target.value)}
            >
              <option value="Nairobi">Nairobi Delivery</option>
              <option value="Kiambu">Kiambu Delivery</option>
              <option value="Machakos">Machakos Delivery</option>
              <option value="Mombasa">Mombasa Delivery</option>
              <option value="Kisumu">Kisumu Delivery</option>
              <option value="Nakuru">Nakuru Delivery</option>
              <option value="Eldoret">Eldoret Delivery</option>
              <option value="Pickup">Pickup</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="deliveryNotes">
            <Form.Label>Delivery Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Landmark, gate color, preferred delivery time"
            />
          </Form.Group>
          <div className="mb-3">
            <Button variant="primary" type="submit">
              Continue
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
