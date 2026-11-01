# Thread & Thimble — Local Dress Shop Security Lab

A fictional dress shop website with fake products, demo accounts and three intentional security flaws for learning and CanTheySeeIt demonstrations.

## Intentional vulnerabilities

1. **IDOR / missing object-level authorization:** a signed-in customer can request another customer's order by numeric ID (for example, `GET /api/orders/1002`).
2. **Missing role authorization:** any signed-in account can update a product's price and stock through `POST /api/products/1/update`.
3. **Client-controlled checkout price:** checkout accepts the `unitPrice` supplied by the browser instead of always using the trusted catalogue price.

These are deliberately insecure demo behaviours, not examples to copy into a real application.

## Demo accounts

- Alice — Customer (`alice`)
- Bob — Customer (`bob`)
- Maya — Employee (`maya`)
- Shop Owner — Owner (`owner`)

Choose an account in the website's demo account selector.

## Run locally on Windows

Requirements: Node.js 18 or newer. No additional npm packages are required.

Open this folder in VS Code, choose **Terminal → New Terminal**, then run:

```powershell
npm start
```

Open **http://127.0.0.1:3000** in your browser. Stop the server with **Ctrl+C** in the terminal.

## Safety

- The server binds to `127.0.0.1` only and uses fictional products, accounts and orders.
- This project intentionally contains security flaws. Do not deploy it, port-forward it, expose it to a public network, or use its test actions against a real shop, college website or real user data.
- This is a learning prototype, not production-ready authentication or a secure commerce application.
