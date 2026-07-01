# Deploying FraudLens to Google Cloud 🚀

This guide explains how to deploy FraudLens (FastAPI Backend, React Frontend, and MySQL Database) to **Google Cloud Platform (GCP)** using **Cloud Run** and **Cloud SQL**.

---

## 🏗️ Architecture
- **Backend**: Containerized FastAPI app deployed on **Cloud Run** (port 8080).
- **Frontend**: Containerized React app served via Nginx on **Cloud Run** (port 80).
- **Database**: Managed **Cloud SQL for MySQL** instance.

---

## 📋 Prerequisites
1. A **Google Cloud Project** with billing enabled.
2. The **Google Cloud SDK (gcloud)** installed locally, OR use **Google Cloud Shell** (highly recommended, as all tools are pre-configured).

---

## 🛠️ Step-by-Step Deployment

### Step 1: Initialize Project & APIs
Open Google Cloud Shell (or your terminal) and configure your project:
```bash
# Log in to Google Cloud
gcloud auth login

# Set your active project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs (Cloud Run, Cloud Build, Cloud SQL)
gcloud services enable run.googleapis.com sqladmin.googleapis.com build.googleapis.com
```

---

### Step 2: Create a Cloud SQL (MySQL) Instance
1. Create a MySQL 8.0 database instance:
   ```bash
   gcloud sql instances create fraudlens-db \
       --database-version=MYSQL_8_0 \
       --tier=db-f1-micro \
       --region=asia-south1
   ```
2. Set the `root` password for the database instance:
   ```bash
   gcloud sql users set-password root \
       --instance=fraudlens-db \
       --password=YOUR_DATABASE_PASSWORD
   ```
3. Create the `fraudlens` database inside the instance:
   ```bash
   gcloud sql databases create fraudlens --instance=fraudlens-db
   ```

---

### Step 3: Build & Deploy Backend on Cloud Run
We will deploy the containerized backend from the root folder. Cloud Run will build the Docker container using **Cloud Build** automatically:

```bash
# Deploy the backend service
gcloud run deploy fraudlens-backend \
    --source=. \
    --port=8080 \
    --set-env-vars DATABASE_URL="mysql+pymysql://root:YOUR_DATABASE_PASSWORD@/fraudlens?unix_socket=/cloudsql/YOUR_PROJECT_ID:asia-south1:fraudlens-db" \
    --add-cloudsql-instances=YOUR_PROJECT_ID:asia-south1:fraudlens-db \
    --allow-unauthenticated \
    --region=asia-south1
```
*Note: Make sure to replace `YOUR_PROJECT_ID` and `YOUR_DATABASE_PASSWORD` with your actual values.*

Once the deployment completes, it will output a Service URL like:
`https://fraudlens-backend-xxxxxx-el.a.run.app`

---

### Step 4: Build & Deploy Frontend on Cloud Run
We will deploy the frontend container from the `frontend` folder and pass the backend URL as a runtime environment variable. Nginx will automatically reverse-proxy any `/api` requests to the backend service at runtime, avoiding any build-time configurations or CORS issues:

```bash
# Deploy the frontend service
gcloud run deploy fraudlens-frontend \
    --source=frontend \
    --port=80 \
    --set-env-vars BACKEND_URL="https://fraudlens-backend-xxxxxx-el.a.run.app" \
    --allow-unauthenticated \
    --region=asia-south1
```
*Note: Replace BACKEND_URL with your actual backend Cloud Run URL (do NOT append `/api` at the end).*

Once finished, the command will output your frontend URL:
`https://fraudlens-frontend-xxxxxx-el.a.run.app`


---

## 🧹 Cleanup
If you need to tear down the services to avoid charges:
```bash
gcloud run services delete fraudlens-backend --region=asia-south1
gcloud run services delete fraudlens-frontend --region=asia-south1
gcloud sql instances delete fraudlens-db
```
