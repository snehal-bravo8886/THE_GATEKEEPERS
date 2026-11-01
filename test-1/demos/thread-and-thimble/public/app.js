const money = value => `₹${Number(value).toLocaleString('en-IN')}`;
const output = document.getElementById('test-output');
let activeUser = null;

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

function log(title, payload) {
  output.textContent = `${title}\n\n${JSON.stringify(payload, null, 2)}`;
}

async function loadProducts() {
  const { products } = await api('/api/products');
  document.getElementById('product-count').textContent = `${products.length} handpicked pieces`;
  document.getElementById('product-grid').innerHTML = products.map(product => `
    <article class="product-card">
      <div class="product-art"><span class="product-category">${product.category.toUpperCase()}</span><span class="product-emoji">${product.emoji}</span></div>
      <h3>${product.name}</h3><p class="product-desc">${product.description}</p>
      <div class="product-bottom"><span class="product-price">${money(product.price)}</span><span class="stock">${product.stock} in stock</span></div>
    </article>`).join('');
}

async function loadOrders() {
  const target = document.getElementById('orders-list');
  if (!activeUser) { target.innerHTML = '<p class="empty-state">Sign in to view orders.</p>'; return; }
  const { orders } = await api('/api/orders');
  if (!orders.length) { target.innerHTML = '<p class="empty-state">No orders yet.</p>'; return; }
  target.innerHTML = orders.map(order => `
    <div class="order-row"><strong>#${order.id} · ${order.productName}</strong><span>${order.customerName} · Qty ${order.quantity}</span><strong>${money(order.total)}</strong><span>${order.status}</span></div>`).join('');
}

function updateAccount() {
  const signedIn = Boolean(activeUser);
  document.getElementById('login-button').classList.toggle('hidden', signedIn);
  document.getElementById('logout-button').classList.toggle('hidden', !signedIn);
  document.getElementById('account-select').disabled = signedIn;
  document.getElementById('welcome-title').textContent = signedIn ? `You're browsing as ${activeUser.name}` : 'You're browsing as a guest';
  document.getElementById('welcome-copy').textContent = signedIn ? `Signed in as ${activeUser.role}. Switch accounts by signing out first.` : 'Choose a demo account above and sign in to explore the shop.';
  document.getElementById('role-pill').textContent = signedIn ? `${activeUser.role.toUpperCase()} ACCOUNT` : 'GUEST BROWSING';
}

async function refresh() {
  const { user } = await api('/api/me');
  activeUser = user;
  updateAccount();
  await loadProducts();
  await loadOrders();
}

function requireAlice() {
  if (!activeUser || activeUser.id !== 'alice') {
    output.textContent = 'Please sign in as Alice · Customer using the account selector, then run this test again.\n\nWhy Alice? The three test cases are designed around a normal customer trying to access actions that should be restricted.';
    return false;
  }
  return true;
}

document.getElementById('login-button').addEventListener('click', async () => {
  try {
    const username = document.getElementById('account-select').value;
    await api('/api/login', { method: 'POST', body: JSON.stringify({ username }) });
    await refresh();
    log('SIGNED IN', { account: activeUser });
  } catch (error) { log('SIGN-IN ERROR', { error: error.message }); }
});

document.getElementById('logout-button').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' });
  await refresh();
  log('SIGNED OUT', { message: 'Choose another demo account to continue.' });
});

document.getElementById('test-idor').addEventListener('click', async () => {
  if (!requireAlice()) return;
  try {
    const result = await api('/api/orders/1002');
    log('TEST 01 — IDOR / ORDER PRIVACY', {
      signedInAs: activeUser,
      requestedOrder: 1002,
      result: 'VULNERABLE: server returned the order even though it belongs to Bob.',
      serverResponse: result,
      expectedSecureResult: '403 Forbidden (or 404 Not Found) for Alice'
    });
  } catch (error) { log('TEST 01 — REQUEST BLOCKED', { error: error.message }); }
});

document.getElementById('test-role').addEventListener('click', async () => {
  if (!requireAlice()) return;
  try {
    const result = await api('/api/products/1/update', { method: 'POST', body: JSON.stringify({ price: 1, stock: 999 }) });
    await loadProducts();
    log('TEST 02 — BROKEN ROLE ACCESS', {
      signedInAs: activeUser,
      result: 'VULNERABLE: a Customer account changed product price and stock.',
      serverResponse: result,
      expectedSecureResult: '403 Forbidden for a Customer account'
    });
  } catch (error) { log('TEST 02 — REQUEST BLOCKED', { error: error.message }); }
});

document.getElementById('test-price').addEventListener('click', async () => {
  if (!requireAlice()) return;
  try {
    const result = await api('/api/checkout', { method: 'POST', body: JSON.stringify({ productId: 1, quantity: 1, unitPrice: 1 }) });
    await loadOrders();
    log('TEST 03 — PRICE TAMPERING', {
      signedInAs: activeUser,
      cataloguePriceBeforeCheckout: result.cataloguePrice,
      priceSentByBrowser: 1,
      result: 'VULNERABLE: checkout used the browser-supplied price.',
      serverResponse: result,
      expectedSecureResult: 'Server should calculate ₹899 from its own catalogue, ignoring the submitted unitPrice'
    });
  } catch (error) { log('TEST 03 — REQUEST BLOCKED', { error.message }); }
});

document.getElementById('reset-button').addEventListener('click', async () => {
  if (!activeUser) { output.textContent = 'Sign in first to reset the local demo data.'; return; }
  try {
    const result = await api('/api/reset', { method: 'POST' });
    await loadProducts();
    await loadOrders();
    log('DEMO DATA RESET', result);
  } catch (error) { log('RESET ERROR', { error: error.message }); }
});

document.getElementById('clear-results').addEventListener('click', () => { output.textContent = 'Log cleared. Run a test when ready.'; });

refresh().catch(error => { output.textContent = `Could not load the demo: ${error.message}` ; });
