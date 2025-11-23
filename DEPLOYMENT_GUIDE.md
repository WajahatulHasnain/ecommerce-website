# Deployment Instructions for Google Cloud Platform

## 📋 What You Need Before Starting

1. **Google Cloud Account**: Sign up at https://cloud.google.com (free $300 credit)
2. **MongoDB Atlas Account**: Sign up at https://cloud.mongodb.com (free 512MB)
3. **Domain Name** (optional): From any provider like Namecheap, GoDaddy, etc.

## 🚀 Step-by-Step Deployment Guide

### Step 1: Setup MongoDB Atlas Database

1. Go to https://cloud.mongodb.com and create an account
2. Create a new cluster (choose FREE tier)
3. Create a database user:
   - Click "Database Access"
   - Add new user with username/password
   - Give "Read and write to any database" permissions
4. Setup Network Access:
   - Click "Network Access"
   - Add IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string:
   - Click "Clusters" → "Connect" → "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

### Step 2: Setup Google Cloud Platform

1. Go to https://console.cloud.google.com
2. Create a new project or select existing one
3. Enable App Engine API:
   - Search "App Engine" in the search bar
   - Click "Enable API"
4. Install Google Cloud CLI on your computer:
   - Download from: https://cloud.google.com/sdk/docs/install
   - Follow installation instructions for your OS

### Step 3: Configure Project Environment

1. Open `app.yaml` file in your project root
2. Replace these values:
   ```yaml
   MONGODB_URI: mongodb+srv://your_username:your_password@your_cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
   JWT_SECRET: your-super-secret-jwt-key-make-it-at-least-32-characters-long
   RESEND_API_KEY: re_your_resend_api_key_if_you_have_one
   ```

### Step 4: Prepare Your Code

1. Open terminal/command prompt
2. Navigate to your project folder:
   ```bash
   cd path/to/your/ecommerce-project
   ```
3. Initialize Google Cloud:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   gcloud app create --region=us-central
   ```

### Step 5: Deploy to Google Cloud

1. Deploy your application:
   ```bash
   gcloud app deploy
   ```
2. When prompted, type `Y` to continue
3. Wait for deployment (5-10 minutes)
4. Your app will be available at: `https://YOUR_PROJECT_ID.appspot.com`

### Step 6: Test Your Deployment

1. Visit your deployed URL
2. Test user registration
3. Test admin login (use the credentials from your `.env` file)
4. Test creating products
5. Test placing orders

## 🔧 Troubleshooting Common Issues

### Issue 1: Build Fails
**Solution**: Make sure all dependencies are installed locally first:
```bash
cd backend && npm install
cd ../frontend && npm install && npm run build
```

### Issue 2: Database Connection Error
**Solution**: Double-check your MongoDB connection string and ensure:
- Username/password are correct
- Network access allows all IPs (0.0.0.0/0)
- Database name is included in the connection string

### Issue 3: Images Not Loading
**Solution**: The uploads folder will be empty on first deploy. Upload some products through the admin panel to test image uploads.

## 🌐 Adding Custom Domain (Optional)

1. Buy a domain from any provider
2. In Google Cloud Console:
   ```bash
   gcloud app domain-mappings create yourdomain.com
   ```
3. Add the DNS records provided by Google to your domain provider

## 💰 Cost Estimate

- **Google App Engine**: Free tier includes 28 instance hours per day
- **MongoDB Atlas**: Free tier includes 512MB storage
- **Total monthly cost**: $0 for small projects (within free limits)

## 📞 Support

If you encounter issues:
1. Check the deployment logs: `gcloud app logs tail -s default`
2. Review the error messages carefully
3. Ensure all environment variables are correctly set
4. Test locally first with `npm run dev` before deploying

---

**Your deployment files are ready! Follow the steps above to deploy your e-commerce website to Google Cloud.**