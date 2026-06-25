export const getError = (error) => {
  return error.response && error.response.data.message
    ? error.response.data.message
    : error.message;
};

export const formatCurrencyKES = (amount) => {
  const value = Number(amount || 0);
  return `KSh ${value.toLocaleString('en-KE')}`;
};

export const KENYA_COUNTIES = [
  'Nairobi',
  'Kiambu',
  'Machakos',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
];

export const getProductImage = (image) => image || '/images/amazona.jpg';

export const getDeliveryFee = ({ county = '', deliveryOption = '' }) => {
  if (deliveryOption === 'Pickup') {
    return 0;
  }
  if (deliveryOption === 'Nairobi') {
    return 200;
  }
  if (deliveryOption === 'Kiambu' || deliveryOption === 'Machakos') {
    return 300;
  }
  if (deliveryOption === 'Mombasa' || deliveryOption === 'Kisumu' || deliveryOption === 'Nakuru') {
    return 500;
  }
  if (deliveryOption === 'Eldoret') {
    return 400;
  }

  const normalized = (county || '').toLowerCase();
  if (normalized === 'nairobi') {
    return 200;
  }
  if (normalized === 'kiambu' || normalized === 'machakos') {
    return 300;
  }
  if (
    normalized === 'mombasa' ||
    normalized === 'kisumu' ||
    normalized === 'nakuru' ||
    normalized === 'eldoret'
  ) {
    return 500;
  }
  return 600;
};
