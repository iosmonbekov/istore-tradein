const axios = require('axios');

const API_URL = 'https://store.tildaapi.one/api/getproductslist/';
const PARAMS = {
  storepartuid: '401407795872',
  recid: '1936178041',
  getallparts: 'true',
  getoptions: 'true',
  slice: '1',
  'filters[quantity]': 'y',
  size: '100',
};

function normalizeProduct(raw) {
  const deviceChar = (raw.characteristics || []).find(
    (c) => c.title === 'Устройство'
  );
  return {
    uid: String(raw.uid),
    title: raw.title || '',
    price: raw.price || '0',
    price_old: raw.priceold || '',
    quantity: raw.quantity || '0',
    device_type: deviceChar ? deviceChar.value : 'Другое',
  };
}

async function fetchProducts() {
  const response = await axios.get(API_URL, {
    params: { ...PARAMS, c: Date.now() },
    timeout: 15000,
  });
  const products = response.data.products || [];
  return products.map(normalizeProduct);
}

module.exports = { fetchProducts };
