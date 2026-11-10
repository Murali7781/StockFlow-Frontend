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
The browser routes are `/login`, `/register`, `/dashboard`, `/products`, and
`/settings`; navigation supports browser Back/Forward and direct route refresh.
`vercel.json` rewrites frontend routes to the SPA entry point for Vercel
deployments.
The frontend stores the short-lived bearer token and signed-in user in local
storage, and restores the session after refresh while the token is valid.
Login and registration fields use standard username/current-password and
username/new-password autocomplete values so Chrome or another browser
password manager can offer saving and autofill with the user's consent.

Run `npm run lint` and `npm run build` to validate the frontend.
