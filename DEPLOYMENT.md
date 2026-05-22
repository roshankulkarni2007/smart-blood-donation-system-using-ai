# Public Deployment

This project is ready to deploy as two public services:

- `server`: Express API
- `client`: Vite React website

## Recommended: Render

1. Push this folder to a GitHub repository.
2. In Render, choose **New > Blueprint**.
3. Select the repository and use the included `render.yaml`.
4. Render will create:
   - `smart-blood-donation-api`
   - `smart-blood-donation-system`
5. After deploy, open:
   - Website: `https://smart-blood-donation-system.onrender.com`
   - API health: `https://smart-blood-donation-api.onrender.com/api/health`

## Manual Deployment Values

API service:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `NODE_ENV=production`
  - `JWT_SECRET=<any-long-random-secret>`
  - `ADMIN_EMAIL=roshankulkarni122@gmail.com`
  - `ADMIN_PASSWORD=<your-admin-password>`
  - `CLIENT_URL=https://your-frontend-domain`
  - `MONGO_URI=<your-mongodb-atlas-connection-string>`
  - `SMTP_HOST=smtp.gmail.com`
  - `SMTP_PORT=587`
  - `SMTP_USER=<your-email@gmail.com>`
  - `SMTP_PASS=<your-gmail-app-password>`
  - `EMAIL_FROM=Smart Blood Donation <your-email@gmail.com>`
  - `GOOGLE_CLIENT_ID=<your-google-oauth-client-id>`

Frontend static site:

- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variables:
  - `VITE_API_URL=https://your-api-domain/api`
  - `VITE_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>`

## Notes

For permanent storage, create a free MongoDB Atlas cluster and paste its connection string into `MONGO_URI` on Render. If `MONGO_URI` is missing, the app still works, but it uses temporary demo memory and data can reset when the server restarts.

For real donor email verification codes, add SMTP values in Render. With Gmail, enable 2-Step Verification on the Gmail account, create an **App Password**, and use that app password as `SMTP_PASS`. If SMTP is missing, the app still works in demo mode and shows the code on screen.

For Google login, create a Google OAuth **Web application** client ID in Google Cloud Console. Add your deployed frontend domain to **Authorized JavaScript origins**, then put the same client ID in both `GOOGLE_CLIENT_ID` for the API and `VITE_GOOGLE_CLIENT_ID` for the frontend.
