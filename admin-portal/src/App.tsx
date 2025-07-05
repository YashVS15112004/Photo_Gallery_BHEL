import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import AlbumManagement from './components/AlbumManagement';
import SystemStats from './components/SystemStats';

function App() {
  return (
    <AuthProvider>
      <Box className="admin-dashboard">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="albums" element={<AlbumManagement />} />
            <Route path="stats" element={<SystemStats />} />
          </Route>
        </Routes>
      </Box>
    </AuthProvider>
  );
}

export default App; 