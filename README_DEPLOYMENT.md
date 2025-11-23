# 🚀 E-commerce MERN Application - Google Cloud Deployment

This is a complete MERN stack e-commerce application ready for deployment on Google Cloud Platform.

## 📁 Project Structure
```
ecommerce-website/
├── frontend/          # React frontend
├── backend/           # Node.js/Express backend  
├── app.yaml          # Google App Engine configuration
├── package.json      # Root package file for deployment
├── .gcloudignore     # Files to ignore during deployment
└── DEPLOYMENT_GUIDE.md # Complete deployment instructions
```

## 🛠️ Technology Stack
- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Node.js, Express, MongoDB
- **Database**: MongoDB Atlas
- **Deployment**: Google App Engine
- **File Storage**: ImgBB for product images

## 🌐 Live Demo
After deployment, your app will be available at:
`https://your-project-id.appspot.com`

## 🚀 Quick Deployment

### Prerequisites
1. Google Cloud account
2. MongoDB Atlas account  
3. Google Cloud CLI installed

### Deploy Steps
1. **Setup Database**: Create MongoDB Atlas cluster and get connection string
2. **Configure**: Update `app.yaml` with your database credentials
3. **Deploy**: Run `gcloud app deploy`

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## ✨ Features
- User authentication (Customer & Admin)
- Product management
- Shopping cart & checkout
- Order management
- Analytics dashboard
- Responsive design
- File uploads
- Email notifications

## 🔧 Local Development
```bash
# Install dependencies
npm run install-deps

# Start development servers
npm run dev

# Frontend: http://localhost:5176
# Backend: http://localhost:5000
```

## 📊 Admin Access
- URL: `/admin/login`
- Email: `wajahatsardar714@gmail.com`
- Password: Check your backend environment variables

## 💰 Cost Estimate
- **Free Tier**: Suitable for small projects
- **Paid Tier**: Scales based on usage
- **MongoDB Atlas**: Free 512MB included

## 📞 Support
For deployment issues, check the deployment logs:
```bash
gcloud app logs tail -s default
```

---
**Built with ❤️ for easy deployment on Google Cloud Platform**