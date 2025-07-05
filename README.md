# Photo Gallery BHEL

A comprehensive web application for managing and displaying photo collections with advanced features including user authentication, album management, image processing, and administrative controls.

## 🚀 Features

### User Features
- **Photo Gallery**: Browse and view photos in a beautiful grid layout
- **Album Organization**: View photos organized by albums
- **User Authentication**: Secure login/logout with JWT tokens
- **Image Upload**: Upload photos with captions and drag-and-drop support
- **Responsive Design**: Mobile-friendly interface with smooth animations
- **Lightbox Viewer**: Full-screen image viewing with navigation

### Admin Features
- **User Management**: Create, edit, delete, and authorize users
- **Album Management**: Organize and manage albums with visibility controls
- **System Monitoring**: View comprehensive system statistics and logs
- **Content Moderation**: Hide/show albums and manage content
- **Authorization Control**: Manage user permissions and roles

### Technical Features
- **Image Optimization**: Automatic compression and resizing to WebP format
- **Real-time Processing**: Immediate image processing with progress tracking
- **Scalable Architecture**: Modular design for easy scaling
- **Performance Optimization**: Efficient database queries and caching
- **Security**: Comprehensive authentication and authorization

## 🛠 Technology Stack

### Frontend
- **React 19.1.0** with TypeScript
- **Material-UI (MUI) v7.1.1** for UI components
- **Framer Motion** for animations
- **React Router DOM** for routing
- **Axios** for API communication
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Sharp** for image processing
- **bcryptjs** for password hashing

### Admin Portal
- **React 18.2.0** with TypeScript
- **Material-UI** for admin interface
- **Recharts** for data visualization
- **Create React App** for build system

## 📁 Project Structure

```
Photo_Gallery_BHEL/
├── src/                          # Main React frontend
│   ├── components/               # React components
│   ├── contexts/                 # React contexts
│   ├── services/                 # API services
│   ├── App.tsx                   # Main application
│   └── main.tsx                  # Entry point
├── admin-portal/                 # Admin interface
│   ├── src/components/           # Admin components
│   ├── public/                   # Static files
│   └── package.json
├── server/                       # Backend API
│   ├── models/                   # Database models
│   ├── routes/                   # API routes
│   ├── middleware/               # Express middleware
│   ├── uploads/                  # Image storage
│   └── server.js                 # Main server file
└── package.json                  # Root dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Photo_Gallery_BHEL
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp server/env.example server/.env
   
   # Edit the .env file with your configuration
   nano server/.env
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately
   npm run dev:frontend    # Frontend on http://localhost:3000
   npm run dev:backend     # Backend on http://localhost:5000
   npm run dev:admin       # Admin portal on http://localhost:3001
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/photo-gallery-bhel

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760
MAX_FILES_PER_UPLOAD=10

# Image Processing Configuration
MAX_IMAGE_DIMENSION=1080
IMAGE_QUALITY=80
```

## 📖 Usage Guide

### For Users

1. **Login**: Use the login modal to authenticate
2. **Browse Albums**: View all available albums on the main page
3. **View Photos**: Click on albums to see photos in a grid layout
4. **Upload Photos**: 
   - Login to your account
   - Navigate to the upload page
   - Create albums or select existing ones
   - Drag and drop images or click to select
   - Add captions and upload

### For Administrators

1. **Access Admin Portal**: Navigate to `/admin-portal`
2. **User Management**:
   - View all users
   - Create new users
   - Authorize/deauthorize users
   - Reset passwords
   - Manage user roles
3. **Album Management**:
   - View all albums
   - Toggle album visibility
   - Delete albums
4. **System Monitoring**:
   - View system statistics
   - Monitor user activity
   - Track uploads and usage

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-based Access**: User and admin roles
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Type and size restrictions
- **CORS Configuration**: Cross-origin request handling
- **Rate Limiting**: API rate limiting for security

## 🎨 UI/UX Features

- **Dark Theme**: Custom dark theme with purple/cyan color scheme
- **Responsive Design**: Mobile-first approach
- **Smooth Animations**: Framer Motion for transitions
- **Material Design**: Material-UI components
- **Accessibility**: WCAG compliant design
- **Loading States**: Skeleton loaders and progress indicators

## 📊 Performance Features

- **Image Optimization**: WebP format with compression
- **Lazy Loading**: Code splitting and lazy component loading
- **Database Indexing**: Optimized MongoDB queries
- **Caching**: LocalStorage for user sessions
- **Bundle Optimization**: Vite for fast builds

## 🚀 Deployment

### Production Build

```bash
# Build all applications
npm run build

# Start production server
cd server
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure MongoDB connection string
3. Set secure JWT secret
4. Configure CORS origins
5. Set up file storage (consider cloud storage for production)

### Docker Deployment (Optional)

```dockerfile
# Example Dockerfile for the backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates and Maintenance

- Regular security updates
- Performance optimizations
- Feature enhancements
- Bug fixes and improvements

---

**Photo Gallery BHEL** - A modern, secure, and scalable photo gallery application built with cutting-edge technologies. 