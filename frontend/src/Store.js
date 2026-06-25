import { createContext, useReducer } from 'react';

export const Store = createContext();

const initialState = {
  userInfo: localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null,
  cart: {
    shippingAddress: localStorage.getItem('shippingAddress')
      ? JSON.parse(localStorage.getItem('shippingAddress'))
      : {},
    paymentMethod: localStorage.getItem('paymentMethod')
      ? localStorage.getItem('paymentMethod')
      : '',
    coupon: localStorage.getItem('coupon')
      ? JSON.parse(localStorage.getItem('coupon'))
      : null,

    cartItems: localStorage.getItem('cartItems')
      ? JSON.parse(localStorage.getItem('cartItems'))
      : [],
  },
  wishlist: localStorage.getItem('wishlist')
    ? JSON.parse(localStorage.getItem('wishlist'))
    : [],
};

const getItemKey = (item) =>
  `${item._id || item.slug}-${item.selectedSize || ''}-${item.selectedColor || ''}`;

function reducer(state, action) {
  switch (action.type) {
    case 'CART_ADD_ITEM':
      // add to cart
      const newItem = action.payload;
      if (newItem.quantity < 1) {
        return state;
      }
      const existItem = state.cart.cartItems.find(
        (item) => getItemKey(item) === getItemKey(newItem)
      );
      const cartItems = existItem
        ? state.cart.cartItems.map((item) =>
            getItemKey(item) === getItemKey(existItem) ? newItem : item
          )
        : [...state.cart.cartItems, newItem];
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      return { ...state, cart: { ...state.cart, cartItems } };
    case 'CART_REMOVE_ITEM': {
      const cartItems = state.cart.cartItems.filter(
        (item) => getItemKey(item) !== getItemKey(action.payload)
      );
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      return { ...state, cart: { ...state.cart, cartItems } };
    }
    case 'CART_CLEAR':
      localStorage.removeItem('cartItems');
      localStorage.removeItem('coupon');
      return {
        ...state,
        cart: { ...state.cart, cartItems: [], coupon: null },
      };
    case 'CART_SAVE_COUPON':
      localStorage.setItem('coupon', JSON.stringify(action.payload));
      return {
        ...state,
        cart: {
          ...state.cart,
          coupon: action.payload,
        },
      };
    case 'USER_SIGNIN':
      return { ...state, userInfo: action.payload };
    case 'USER_SIGNOUT':
      localStorage.removeItem('wishlist');
      localStorage.removeItem('coupon');
      return {
        ...state,
        userInfo: null,
        cart: {
          cartItems: [],
          shippingAddress: {},
          paymentMethod: '',
          coupon: null,
        },
        wishlist: [],
      };
    case 'SAVE_SHIPPING_ADDRESS':
      return {
        ...state,
        cart: {
          ...state.cart,
          shippingAddress: action.payload,
        },
      };
    case 'SAVE_PAYMENT_METHOD':
      localStorage.setItem('paymentMethod', action.payload);
      return {
        ...state,
        cart: {
          ...state.cart,
          paymentMethod: action.payload,
        },
      };
    case 'WISHLIST_TOGGLE': {
      const item = action.payload;
      const exists = state.wishlist.find((x) => x._id === item._id);
      const wishlist = exists
        ? state.wishlist.filter((x) => x._id !== item._id)
        : [...state.wishlist, item];
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      return {
        ...state,
        wishlist,
      };
    }
    default:
      return state;
  }
}
export function StoreProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = { state, dispatch };
  return <Store.Provider value={value}>{props.children}</Store.Provider>;
}
