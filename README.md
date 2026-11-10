# StockFlow MVP frontend

Responsive React interface for the Phase 1 six-hour MVP: signup/login,
organization-scoped dashboard, product CRUD, and the default low-stock
threshold setting. The navigation is intentionally limited to Dashboard,
Products, and Settings. Charts, orders, warehouses, integrations, and other
out-of-scope modules are not included.

## Run locally

1. Start the API from `../backend` and configure its MySQL connection.
2. Run `npm install`.
3. Run `npm run dev` and open the Vite URL.
4. Register a workspace or sign in.

Vite proxies `/api` requests to `http://localhost:3000`. Set `VITE_API_URL` to
an absolute API base URL when deploying without a same-origin `/api` proxy.
The frontend stores the short-lived bearer token and signed-in user in local
storage, and restores the session after refresh while the token is valid.

Run `npm run lint` and `npm run build` to validate the frontend.
