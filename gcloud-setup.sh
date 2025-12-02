# Google Cloud Setup for Taxi-Tao
# Run these commands IN ORDER after installing Google Cloud CLI

# 1. Login to Google Cloud
gcloud auth login

# 2. Create new project
gcloud projects create taxi-tao-live --name="Taxi-Tao"

# 3. Set as active project
gcloud config set project taxi-tao-live

# 4. Enable billing (REQUIRED - you'll need to link a billing account)
# Go to: https://console.cloud.google.com/billing/linkedaccount?project=taxi-tao-live
# OR run: gcloud billing accounts list
# Then: gcloud billing projects link taxi-tao-live --billing-account=BILLING_ACCOUNT_ID

# 5. Enable required APIs
gcloud services enable maps-backend.googleapis.com
gcloud services enable distance-matrix-backend.googleapis.com
gcloud services enable directions-backend.googleapis.com

# 6. Create API key
gcloud alpha services api-keys create --display-name="Taxi-Tao Maps Key"

# 7. List API keys to get your key
gcloud alpha services api-keys list

# 8. Copy the KEY VALUE and add to .env.local:
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
