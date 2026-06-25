export const getError = (error) => {
  return error.response && error.response.data.message
    ? error.response.data.message
    : error.message;
};

export const formatCurrencyKES = (amount) => {
  const value = Number(amount || 0);
  return `KSh ${value.toLocaleString('en-KE')}`;
};
