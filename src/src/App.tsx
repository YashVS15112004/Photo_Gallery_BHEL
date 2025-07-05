import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { AlbumProvider } from './contexts/AlbumContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import PhotoGallery from './components/PhotoGallery';
import UploadPage from './components/UploadPage';
import AlbumDetail from './components/AlbumDetail';
import LoginModal from './components/LoginModal';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <AlbumProvider>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<PhotoGallery />} />
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/album/:id" element={<AlbumDetail />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <LoginModal />
        </Box>
      </AlbumProvider>
    </AuthProvider>
  );
}

export default App; 