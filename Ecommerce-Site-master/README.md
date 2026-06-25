# Home

![](https://github.com/roy-276/Ecommerce-Site/blob/master/frontend/public/images/Home.png)

## Split Frontend/Backend Deployment

This project now supports deploying frontend and backend separately.

### Backend deployment

Deploy the `backend` folder as a Node service.

Environment variables:

- `PORT=5000`
- `MONGODB_URI=your_mongodb_connection_string`
- `JWT_SECRET=your_jwt_secret`
- `PAYPAL_CLIENT_ID=your_paypal_client_id`
- `CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:3000`
- `SERVE_FRONTEND=false`

If you want the old monolithic behavior where backend serves frontend build, set:

- `SERVE_FRONTEND=true`

### Frontend deployment

Deploy the `frontend` folder as a static React app.

Set frontend env variable before build:

- `REACT_APP_API_URL=https://your-backend-domain.com`

For local development, you can keep `REACT_APP_API_URL` empty and use the existing `proxy` in `frontend/package.json`.

### Vercel (Frontend) setup

Use Vercel for frontend only (static React app).

This repository includes a root `vercel.json` that:

- builds `frontend`
- publishes `frontend/build`
- rewrites all SPA routes to `index.html`

Required environment variable in Vercel project settings:

- `REACT_APP_API_URL=https://your-backend-domain.com`

Important:

- Backend should be deployed separately as a Node service (Render/Railway/Fly/etc).
- Set backend `CORS_ORIGINS` to include your Vercel frontend domain.

### Local dev (split)

1. Start backend from `backend`:
	- `npm install`
	- `npm start`
2. Start frontend from `frontend`:
	- `npm install`
	- `npm start`
