# Deploying FraudLens to Render 🚀

This guide explains how to deploy FraudLens (FastAPI Backend and React Frontend) to **Render.com**.

---

## 🏗️ Deployment Strategy

On Render, you can deploy the frontend in two ways:
1. **Option A (Recommended & Simplest)**: Deploy the Frontend as a **Static Site** (fast and free).
2. **Option B**: Deploy the Frontend as a **Web Service** using the Dockerfile (utilizes our Nginx reverse proxy).

---

## 🛠️ Step 1: Deploy Backend (Web Service)

1. Log in to **Render.com** and click **New > Web Service**.
2. Connect your Git repository.
3. Configure the following service settings:
   - **Name**: `fraudlens-backend`
   - **Language**: `Python 3` (or choose `Docker` if you want to deploy using `backend/Dockerfile` with the build context set to `backend`).
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `PYTHONPATH=backend uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add the following **Environment Variables**:
   - `GEMINI_API_KEY`: *(Optional)* Your Gemini API Key.
   - `DATABASE_URL`: *(Optional)* If using external MySQL. If omitted, it will automatically fall back to SQLite, and on first start, the database will be **automatically seeded** with all demo data!
5. Click **Deploy Web Service**.
6. Copy your Backend URL (e.g. `https://fraudlens-backend.onrender.com`).

---

## 🛠️ Step 2: Deploy Frontend (Static Site - Option A)

This is the standard and most cost-effective way to host Vite React apps on Render.

1. Click **New > Static Site**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name**: `fraudlens-frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add the following **Environment Variable** (Crucial!):
   - **Key**: `VITE_API_URL`
   - **Value**: `https://fraudlens-backend.onrender.com` *(Replace this with your actual Backend URL from Step 1. The code will automatically normalize and append `/api` for you).*
5. Click **Create Static Site**.

---

## 🛠️ Step 2: Deploy Frontend (Web Service - Option B)

Use this option if you want to run the Docker container with our Nginx reverse proxy.

1. Click **New > Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name**: `fraudlens-frontend-web`
   - **Language**: `Docker`
   - **Docker Context**: `frontend`
4. Add the following **Environment Variable**:
   - **Key**: `BACKEND_URL`
   - **Value**: `https://fraudlens-backend.onrender.com` *(Replace with your actual Backend URL from Step 1).*
5. Click **Deploy Web Service**.
