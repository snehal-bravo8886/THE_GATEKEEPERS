'use strict';

// LOCAL-ONLY SECURITY TRAINING DEMO.
// This app intentionally contains authorization/business-logic flaws.
// It binds to 127.0.0.1 and uses fake data. Do not deploy it to the internet.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const HOST = '127.0.0.1';
const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const sessions = new Map();

const USERS = {
  alice: { id: 'alice', name: 'Alice', role: 'Customer' },
  bob: { id: 'bob', name: 'Bob', role: 'Customer' },
  maya: { id: 'maya', name: 'Maya', role: 'Employee' },
  owner: { id: 'owner', name: 'Shop Owner', role: 'Owner' }
};

function seedData() {
  return {
    products: [
      { id: 1, name: 'Floral Anarkali Kurti', category: 'Kurtis', price: 899, stock: 12, description: 'A breezy everyday favourite with a soft floral print.', emoji: '🌸' },
      { id: 2, name: 'Classic Linen Shirt', category: 'Tops', price: 1199, stock: 8, description: 'An easy, relaxed fit for warm days.', emoji: '🤍' },
      { id: 3, name: 'Indigo Denim Jacket', category: 'Outerwear', price: 1799, stock: 5, description: 'A timeless layer for casual outfits.', emoji: '🧥' },
      { id: 4, name: 'Everyday Cotton Dress', category: 'Dresses', price: 1499, stock: 9, description: 'Soft cotton and a comfortable day-long fit.', emoji: '👗' }
    ],
    orders: [
      { id: 1001, customerId: 'alice', customerName: 'Alice', productId: 1, productName: 'Floral Anarkali Kurti', quantity: 1, total: 899, status: 'Confirmed' },
      { id: 1002, customerId: 'bob', customerName: 'Bob', productId: 2, productName: 'Classic Linen Shirt', quantity: 1, total: 1199, status: 'Packed' }
    ],
    nextOrderId: 1003
  };
}

let data = seedData();

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 100_000) {
        reject(new Error('Request body is too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('Request body must be valid JSON')); }
    });
    req.on('error', reject);
  });
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';
  const part = cookieHeader.split(';').map(x => x.trim()).find(x => x.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}

function currentUser(req) {
  const sid = getCookie(req, 'dressshop_sid');
  return sid ? sessions.get(sid) || null : null;
}

function requireLogin(req, res) {
  const user = currentUser(req);
  if (!user) sendJson(res, 401, { error: 'Please sign in with a demo account first.' });
  return user;
}

function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(PUBLIC_DIR, `.${requested}`);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  try {
    if (method === 'POST' && pathname === '/api/login') {
      const body = await readJson(req);
      const user = USERS[String(body.username || '')];
      if (!user) return sendJson(res, 400, { error: 'Choose one of the demo accounts.' });
      const sid = crypto.randomUUID();
      sessions.set(sid, user);
      res.writeHead(200, {
        'Set-Cookie': `dressshop_sid=${encodeURIComponent(sid)}; HttpOnly; SameSite=Lax; Path=/`,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      return res.end(JSON.stringify({ user }));
    }

    if (method === 'POST' && pathname === '/api/logout') {
      const sid = getCookie(req, 'dressshop_sid');
      if (sid) sessions.delete(sid);
      res.writeHead(200, { 'Set-Cookie': 'dressshop_sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0', 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true }));
    }

    if (method === 'GET' && pathname === '/api/me') {
      return sendJson(res, 200, { user: currentUser(req) });
    }

    if (method === 'GET' && pathname === '/api/products') {
      return sendJson(res, 200, { products: data.products });
    }

    if (method === 'GET' && pathname === '/api/orders') {
      const user = requireLogin(req, res);
      if (!user) return;
      const orders = user.role === 'Customer'
        ? data.orders.filter(order => order.customerId === user.id)
        : data.orders;
      return sendJson(res, 200, { orders });
    }

    // INTENTIONAL FLAW 1 — IDOR / missing object-level authorization.
    // A logged-in customer can request another customer's order by changing its ID.
    const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
    if (method === 'GET' && orderMatch) {
      const user = requireLogin(req, res);
      if (!user) return;
      const order = data.orders.find(item => item.id === Number(orderMatch[1]));
      if (!order) return sendJson(res, 404, { error: 'Order not found.' });
      // VULNERABLE: this should verify that a Customer owns the order.
      return sendJson(res, 200, { order, note: 'Demo flaw: ownership was not checked.' });
    }

    // INTENTIONAL FLAW 2 — broken function-level access control.
    // Any signed-in account can update stock or price; this should be Owner-only
    // (and stock updates could have a separate Employee permission).
    const productMatch = pathname.match(/^\/api\/products\/(\d+)\/update$/);
    if (method === 'POST' && productMatch) {
      const user = requireLogin(req, res);
      if (!user) return;
      const body = await readJson(req);
      const product = data.products.find(item => item.id === Number(productMatch[1]));
      if (!product) return sendJson(res, 404, { error: 'Product not found.' });
      if (Number.isFinite(Number(body.price))) product.price = Number(body.price);
      if (Number.isFinite(Number(body.stock))) product.stock = Number(body.stock);
      return sendJson(res, 200, { ok: true, product, changedBy: user.name, note: 'Demo flaw: role permission was not checked.' });
    }

    // INTENTIONAL FLAW 3 — checkout trusts the price supplied by the browser.
    // A real server must calculate totals from its own product catalogue.
    if (method === 'POST' && pathname === '/api/checkout') {
      const user = requireLogin(req, res);
      if (!user) return;
      const body = await readJson(req);
      const product = data.products.find(item => item.id === Number(body.productId));
      const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 1));
      if (!product) return sendJson(res, 404, { error: 'Product not found.' });
      const clientSuppliedPrice = Number(body.unitPrice);
      const chargedUnitPrice = Number.isFinite(clientSuppliedPrice) ? clientSuppliedPrice : product.price;
      const order = {
        id: data.nextOrderId++, customerId: user.id, customerName: user.name,
        productId: product.id, productName: product.name, quantity,
        total: chargedUnitPrice * quantity, status: 'Confirmed'
      };
      data.orders.push(order);
      return sendJson(res, 201, { ok: true, order, cataloguePrice: product.price, note: 'Demo flaw: server trusted the browser price.' });
    }

    if (method === 'POST' && pathname === '/api/reset') {
      const user = requireLogin(req, res);
      if (!user) return;
      data = seedData();
      return sendJson(res, 200, { ok: true, message: 'Demo data reset.' });
    }

    if (method.startsWith('GET') && !pathname.startsWith('/api/')) return serveStatic(req, res, pathname);
    return sendJson(res, 404, { error: 'Route not found.' });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Request failed.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Thread & Thimble security lab is running at http://${HOST}:${PORT}`);
  console.log('Local-only demo with intentional flaws. Do not expose or deploy it publicly.');
});
