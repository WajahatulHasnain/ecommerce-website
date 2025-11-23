# Vercel Deployment Guide for MERN E-commerce App

## Prerequisites
1. GitHub account
2. Vercel account (free signup at vercel.com)

## Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project"
3. Import your repository: `WajahatulHasnain/ecommerce-website`
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

## Step 3: Environment Variables
Add these environment variables in Vercel dashboard:

### Required Variables:
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `NODE_ENV`: production
- `FRONTEND_URL`: https://your-app-name.vercel.app (update after deployment)

### Email Variables (Optional):
- `RESEND_API_KEY`: Your email service API key
- `EMAIL_FROM`: Your sender email
- `EMAIL_USER`: Gmail username (if using Gmail)
- `EMAIL_PASS`: Gmail app password (if using Gmail)

## Step 4: Deploy
Click "Deploy" and wait for the build to complete!

## Step 5: Update Frontend URL
After deployment, update the `FRONTEND_URL` environment variable with your actual Vercel URL.

## Features Included:
✅ Admin Dashboard with Analytics
✅ Product Management
✅ Order Management
✅ User Authentication
✅ Customer Portal
✅ Mobile Responsive Design

## Live Analytics Data:
Your analytics charts will show real data from your MongoDB database with 20 sample orders and $20,666 in revenue!

## Support:
- Free hosting for personal projects
- Automatic deployments from GitHub
- SSL certificates included
- Global CDN