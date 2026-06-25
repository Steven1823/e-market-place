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

const OFFLINE_USERS_KEY = 'offlineUsers';
const defaultOfflineUsers = [
  {
    _id: 'offline-admin',
    name: 'Roy',
    email: 'admin@example.com',
    password: '123456',
    isAdmin: true,
  },
  {
    _id: 'offline-user',
    name: 'Zack',
    email: 'user@example.com',
    password: '123456',
    isAdmin: false,
  },
];

export const getOfflineUsers = () => {
  try {
    const savedUsers = localStorage.getItem(OFFLINE_USERS_KEY);
    if (!savedUsers) {
      localStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(defaultOfflineUsers));
      return defaultOfflineUsers;
    }
    const parsedUsers = JSON.parse(savedUsers);
    return Array.isArray(parsedUsers) ? parsedUsers : defaultOfflineUsers;
  } catch (error) {
    return defaultOfflineUsers;
  }
};

const saveOfflineUsers = (users) => {
  localStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(users));
};

export const signinOfflineUser = ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getOfflineUsers().find(
    (item) => item.email.toLowerCase() === normalizedEmail && item.password === password
  );
  if (!user) {
    throw new Error('Invalid email or password');
  }
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    token: 'offline-demo-token',
    offlineMode: true,
  };
};

export const signupOfflineUser = ({ name, email, password }) => {
  const users = getOfflineUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (users.find((item) => item.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Email already exists');
  }
  const newUser = {
    _id: `offline-${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    password,
    isAdmin: false,
  };
  const nextUsers = [...users, newUser];
  saveOfflineUsers(nextUsers);
  return {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    isAdmin: newUser.isAdmin,
    token: 'offline-demo-token',
    offlineMode: true,
  };
};

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
