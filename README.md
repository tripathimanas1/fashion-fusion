# FashionFusion - AI-Powered Fashion Design Platform

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-0.104.1-green?style=for-the-badge&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/AWS%20S3-Storage-FF9900?style=for-the-badge&logo=amazon-s3" alt="AWS S3">
</div>

## 🎥 Live Demo

[![FashionFusion Demo](https://img.shields.io/badge/🎥-Watch%20Demo-red?style=for-the-badge)](https://www.loom.com/share/a9febcf45d74401ea6d0b654f41a9029)

<div align="center">
  <a href="https://www.loom.com/share/a9febcf45d74401ea6d0b654f41a9029">
    <img src="https://cdn.loom.com/sessions/thumbnails/a9febcf45d74401ea6d0b654f41a9029-with-play.gif" alt="FashionFusion App Demo" width="800">
  </a>
</div>

---

FashionFusion is a production-ready AI-powered fashion design platform that enables users to create stunning fashion designs using cutting-edge AI technology. The platform features AI-powered design generation, virtual try-on capabilities, and a marketplace for connecting with local tailors.

## ✨ Key Features

### 🎨 AI Design Generation
- **Prompt-based Generation**: Create designs from text descriptions
- **Image-to-Image**: Use reference images to guide generation
- **Sketch-to-Design**: Convert rough sketches into professional designs
- **Color Palette Extraction**: AI-powered color analysis and fabric recommendations
- **Style Recommendations**: CLIP-based style matching and suggestions

### 👗 Virtual Try-On
- Upload body photos and garment images
- AI-powered virtual fitting simulation
- Body measurement analysis

### 🖼️ Design Gallery & Inspiration
- Browse trending designs
- Save designs to personal boards
- Discover similar styles using AI recommendations

### 🛍️ Marketplace
- Connect with local tailors
- Place manufacturing orders
- Track order status
- Compare quotes from multiple tailors

## 🏗️ Architecture

```
Frontend (Next.js + React + Tailwind)
           ↓
    FastAPI Backend
           ↓
    Cloud GPU AI Services
           ↓
   PostgreSQL + S3 Storage
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **TailwindCSS** - Modern utility-first styling
- **Lucide React** - Beautiful icon library
- **React Dropzone** - Drag-and-drop file uploads
- **Axios** - HTTP client with interceptors

### Backend
- **FastAPI** - Modern async Python web framework
- **SQLAlchemy** - Powerful ORM with async support
- **PostgreSQL** - Production-grade database
- **AWS S3** - Scalable file storage
- **Pydantic** - Data validation and settings

### AI Services
- **Google AI Studio (Gemini)** - Text-to-image generation
- **Replicate API** - Advanced AI model hosting
- **Stable Diffusion** - Image generation backbone
- **CLIP** - Style and similarity matching
- **OpenAI** - Advanced text processing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL database
- AWS S3 bucket (or compatible)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fashion-fusion.git
cd fashion-fusion
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python create_fresh_database.py
python main.py
```

3. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URLs
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📋 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/fashionfusion

# AI Services
GOOGLE_API_KEY=your_google_api_key
REPLICATE_API_TOKEN=your_replicate_token

# S3 Storage
S3_BUCKET=your_bucket_name
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_REGION=us-east-1
S3_ENDPOINT=optional_custom_endpoint

# Security
SECRET_KEY=your_jwt_secret_key
JWT_SECRET=your_jwt_secret
```

### ⚠️ Security Notes
- **Never commit credentials to GitHub**
- **All sensitive values are empty in config.py**
- **Set actual values in your .env file**
- **Use environment variables in production**

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individual services
docker build -t fashion-fusion-frontend ./frontend
docker build -t fashion-fusion-backend ./backend
```

## 📦 Production Deployment

### Vercel (Frontend)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Railway/Render (Backend)
1. Connect repository to Railway/Render
2. Configure PostgreSQL database
3. Set environment variables
4. Deploy automatically

### AWS S3 Setup
1. Create S3 bucket
2. Configure CORS for your domain
3. Set up IAM user with S3 permissions
4. Add credentials to environment variables

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📁 Project Structure

```
fashion-fusion/
├── frontend/                 # Next.js React application
│   ├── components/          # Reusable React components
│   ├── pages/              # Next.js pages
│   ├── styles/             # Global styles and Tailwind
│   └── utils/             # Utility functions
├── backend/                 # FastAPI Python application
│   ├── api/                # API route handlers
│   ├── models/             # SQLAlchemy models
│   ├── services/           # Business logic and AI services
│   └── database/          # Database configuration
├── database/               # Database schema and migrations
├── docker-compose.yml      # Multi-service Docker configuration
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI Studio** - For providing powerful image generation
- **Replicate** - For hosting advanced AI models
- **Unsplash** - For beautiful sample images
- **TailwindCSS** - For amazing utility-first CSS framework

## 📞 Support

If you have any questions or need support, please:
- Open an issue on GitHub
- Contact us at support@fashionfusion.com
- Check our [documentation](https://docs.fashionfusion.com)

---

<div align="center">
  <strong>⭐ Star this repository if it helped you!</strong><br>
  <em>Built with ❤️ by the FashionFusion Team</em>
</div>

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Pydantic** - Data validation

### AI Services
- **Replicate API** - Primary AI inference
- **Stable Diffusion 1.5** - Image generation
- **ControlNet** - Sketch conditioning
- **CLIP** - Style recommendations
- **OpenCV + scikit-learn** - Color extraction

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL
- Replicate API token

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Set up database:
```bash
# Create database
createdb fashionfusion

# Run schema
psql fashionfusion < database/schema.sql
```

6. Start backend server:
```bash
python main.py
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

4. Start frontend server:
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost/fashionfusion

# Security
JWT_SECRET=your-super-secret-jwt-key-here

# Replicate API
REPLICATE_API_TOKEN=your-replicate-api-token

# AWS S3 Storage (optional)
S3_BUCKET=fashionfusion-storage
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_REGION=us-east-1
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Replicate API Setup

1. Sign up at [Replicate](https://replicate.com)
2. Get your API token from dashboard
3. Add token to `REPLICATE_API_TOKEN` environment variable

## 🚀 Running in Production

### Using Docker (Recommended)

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

### Manual Deployment

1. **Backend**:
   - Use Gunicorn for production:
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

2. **Frontend**:
   - Build for production:
   ```bash
   npm run build
   npm start
   ```

3. **Database**:
   - Use managed PostgreSQL service
   - Set up connection pooling
   - Configure backups

4. **Storage**:
   - Use AWS S3 or Cloudflare R2 for image storage
   - Configure CDN for faster delivery

## 📊 API Documentation

Once the backend is running, visit:
- **API Docs**: `http://localhost:8000/docs`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

### Key Endpoints

#### Design Generation
- `POST /api/v1/designs/generate` - Generate designs from prompt/image
- `POST /api/v1/designs/sketch-to-design` - Convert sketch to design

#### Virtual Try-On
- `POST /api/v1/tryon/virtual-tryon` - Process virtual try-on
- `POST /api/v1/tryon/analyze-body` - Analyze body measurements

#### Recommendations
- `POST /api/v1/recommendations/styles/from-image` - Get style recommendations
- `GET /api/v1/recommendations/trending` - Get trending designs

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

## 🎯 Performance Targets

- **Design Generation**: 3-8 seconds per request
- **Virtual Try-On**: 5-10 seconds per request
- **Image Upload**: <2 seconds
- **API Response**: <500ms for non-AI endpoints

## 🔒 Security

- JWT-based authentication
- API rate limiting
- Input validation and sanitization
- Secure file upload handling
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the troubleshooting guide

## 🗺️ Roadmap

- [ ] Advanced virtual try-on with multiple poses
- [ ] Real-time design collaboration
- [ ] Mobile app development
- [ ] Advanced fabric simulation
- [ ] Social features and sharing
- [ ] Integration with fashion brands
- [ ] AR try-on capabilities
