# Admin Portal - Photo Gallery BHEL

A comprehensive admin portal for managing the Photo Gallery BHEL system. This separate website provides administrators with powerful tools to manage users, albums, monitor system activity, and generate reports.

## Features

### 🔐 Admin Authentication
- Secure login system for administrators
- JWT-based authentication
- Role-based access control
- Session management

### 👥 User Management
- **View All Users**: Complete list of registered users with details
- **Create Users**: Add new users with auto-generated passwords
- **Edit Users**: Modify user details, roles, and authorization status
- **Delete Users**: Remove users and all their associated content
- **Password Management**: Reset user passwords with secure random generation

### 📁 Album Administration
- **View All Albums**: Complete overview of all albums in the system
- **Manage Visibility**: Toggle album visibility (hidden/visible)
- **Delete Albums**: Remove albums and all associated images
- **Album Details**: View album information, creator, and image count

### 📊 System Monitoring & Logs
- **Activity Tracking**: Automatic logging of all user actions
- **Audit Trail**: Complete history of system modifications
- **Filtered Logs**: Search and filter logs by date, user, action type
- **Real-time Monitoring**: Track login/logout events and system usage

### 📈 Reports & Analytics
- **System Statistics**: Overview of users, albums, and images
- **User Activity Reports**: Track user engagement and login patterns
- **Album Usage Reports**: Monitor album creation and image uploads
- **Performance Metrics**: System performance and storage statistics
- **Export Functionality**: Generate and download reports

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **React Query** for data fetching and caching
- **React Hook Form** with Zod validation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Backend Integration
- **Axios** for API communication
- **JWT** for authentication
- **RESTful API** integration with the main server

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- The main Photo Gallery BHEL server running on port 5000

### Installation

1. **Navigate to the admin portal directory:**
   ```bash
   cd admin-portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the admin portal:**
   Open your browser and navigate to `http://localhost:3001/admin-portal`

### Building for Production

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Preview the production build:**
   ```bash
   npm run preview
   ```

## Usage Guide

### Admin Login
1. Navigate to `/admin-portal` in your browser
2. Enter admin username and password
3. Click "Login" button
4. Access the admin dashboard

### User Management
1. Click "Users" in the admin navigation
2. View all registered users in a comprehensive table
3. **Create User**: Click "Add User" → Fill form → System generates password
4. **Edit User**: Click edit icon → Modify details → Save changes
5. **Delete User**: Click delete icon → Confirm deletion
6. **Reset Password**: Click key icon → Confirm → Share new password

### Album Administration
1. Click "Albums" in admin navigation
2. View all albums with thumbnails and details
3. **Toggle Visibility**: Click eye icon to hide/show albums
4. **Delete Albums**: Click delete button → Confirm deletion

### System Monitoring
1. Click "Activity Logs" in admin navigation
2. View comprehensive activity logs with filters
3. Filter by date range, user, action type, or search terms
4. Monitor system performance and user activity

### Reports & Analytics
1. Click "Reports" in admin navigation
2. View system statistics and performance metrics
3. Generate user activity and album usage reports
4. Export reports for external analysis

## API Endpoints

The admin portal communicates with the main server through these endpoints:

### Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/me` - Get current admin user

### User Management
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/reset-password` - Reset user password

### Album Management
- `GET /api/admin/albums` - Get all albums
- `DELETE /api/admin/albums/:id` - Delete album
- `PUT /api/admin/albums/:id` - Update album visibility

### System Monitoring
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/logs` - Get activity logs with filters
- `GET /api/admin/reports` - Get system reports and analytics

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Only admin users can access the portal
- **Input Validation**: Comprehensive form validation with Zod
- **CSRF Protection**: Built-in protection against cross-site request forgery
- **Activity Logging**: Complete audit trail of all admin actions
- **Secure Password Reset**: Random password generation for user resets

## File Structure

```
admin-portal/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   ├── Layout.tsx    # Main layout with sidebar
│   │   └── LoginForm.tsx # Admin login form
│   ├── pages/
│   │   ├── Dashboard.tsx # System overview
│   │   ├── Users.tsx     # User management
│   │   ├── Albums.tsx    # Album administration
│   │   ├── ActivityLogs.tsx # System monitoring
│   │   └── Reports.tsx   # Analytics and reports
│   ├── hooks/
│   │   └── useAuth.ts    # Authentication hook
│   ├── lib/
│   │   ├── api.ts        # API client
│   │   └── utils.ts      # Utility functions
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # App entry point
├── public/               # Static assets
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── README.md            # This file
```

## Configuration

### Environment Variables
Create a `.env` file in the admin-portal directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### Vite Configuration
The development server is configured to:
- Run on port 3001
- Proxy API requests to the main server (port 5000)
- Enable hot module replacement for development

## Contributing

1. Follow the existing code style and patterns
2. Add proper TypeScript types for new features
3. Include error handling and loading states
4. Test all functionality before submitting changes
5. Update documentation for new features

## Support

For issues or questions:
1. Check the main Photo Gallery BHEL documentation
2. Review the API endpoints and server logs
3. Ensure the main server is running and accessible
4. Verify admin credentials and permissions

## License

This admin portal is part of the Photo Gallery BHEL project and follows the same licensing terms. 