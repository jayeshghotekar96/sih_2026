# DecentraX Full-Stack Deployment Guide
**Smart India Hackathon 2026 | Bharat Electronics Limited (SIH26125)**

This guide provides instructions to deploy the complete DecentraX platform across:
1. **Live Blockchain Layer:** Polygon Amoy Testnet (Chain ID `80002`)
2. **Frontend Web Portal:** Vercel (Instant 1-Click via GitHub)
3. **Backend Security Gateway:** Render.com (Free Node.js Web Service)

---

## ⛓️ Phase 1: Deploy Smart Contracts to Polygon Amoy Testnet

### Step 1.1: Obtain Testnet POL (MATIC)
1. Copy your MetaMask wallet address.
2. Visit the official Polygon Amoy Faucet:  
   👉 **[https://faucet.polygon.technology/](https://faucet.polygon.technology/)**
3. Select **Network:** `Polygon Amoy`, enter your wallet address, and request testnet tokens.

### Step 1.2: Configure Environment
In your local workspace:
1. Navigate to the `contracts/` directory:
   ```bash
   cd contracts
   ```
2. Create your `.env` file from the provided template:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and set your `PRIVATE_KEY` (the private key of your funded wallet):
   ```env
   AMOY_RPC_URL="https://rpc-amoy.polygon.technology/"
   PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"
   ```

### Step 1.3: Run the Deployment Script
```bash
npx hardhat run scripts/deploy.js --network amoy
```

### What Happens Automatically:
- Compiles `DecentraXAccessControl.sol`, `IdentityRegistry.sol`, `AssetNFT.sol`, and `DecentraXAuditLogger.sol`.
- Deploys all 4 contracts to Polygon Amoy.
- Seeds initial role bindings (`ADMIN_ROLE` for Identity Registry, etc.).
- Automatically exports the deployed addresses to `frontend/src/contracts/deployed-contracts.json`.
- Displays the live PolygonScan URLs for your deployed contracts.

---

## 🌐 Phase 2: Deploy Frontend Portal to Vercel (1-Click)

The repository is already configured with [`vercel.json`](file:///c:/Users/Asus/OneDrive/Desktop/sih_2026/vercel.json).

### Steps:
1. Go to **[https://vercel.com](https://vercel.com)** and sign in with your GitHub account (`jayeshghotekar96`).
2. Click **"Add New..."** ➔ **"Project"**.
3. Under **Import Git Repository**, select:
   ```
   jayeshghotekar96/sih_2026
   ```
4. Configure Project:
   - **Framework Preset:** `Vite` (Auto-detected)
   - **Root Directory:** `./` (Leave as default, `vercel.json` will build `frontend`)
   - **Build Command:** `npm --prefix frontend run build` (Pre-configured)
   - **Output Directory:** `frontend/dist` (Pre-configured)
5. Click **"Deploy"**!

*Within 60 seconds, Vercel will provide your live public URL (e.g. `https://sih-2026.vercel.app`), fully secured with HTTPS and global CDN delivery.*

---

## 🛡️ Phase 3: Deploy Backend Security Gateway to Render.com (Free)

The repository includes a ready-to-use [`render.yaml`](file:///c:/Users/Asus/OneDrive/Desktop/sih_2026/render.yaml) specification.

### Steps:
1. Sign up / Log in to **[https://render.com](https://render.com)** using your GitHub account.
2. Click **"New +"** ➔ **"Web Service"**.
3. Select your repository: `jayeshghotekar96/sih_2026`.
4. Enter configuration:
   - **Name:** `decentrax-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. (Optional) Under **Environment Variables**, add:
   - `PINATA_JWT`: Your Pinata API token (if using Pinata cloud pinning).
6. Click **"Create Web Service"**.

*Render will deploy the Express server and provide your public API gateway URL (e.g. `https://decentrax-backend.onrender.com`).*

---

## 🔄 Updating Frontend to Connect to Live Backend (Optional)
If you deploy the backend to Render, update the backend API URL in `frontend/src/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://decentrax-backend.onrender.com';
```
And add `VITE_API_URL` as an Environment Variable in your Vercel Project Settings!
