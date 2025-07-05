import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  AccountCircle,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, openLoginModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Hide admin and upload buttons on upload page
  const isOnUploadPage = location.pathname === '/upload';
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const handleUpload = () => {
    navigate('/upload');
    handleMenuClose();
  };

  const handleAdmin = () => {
    navigate('/admin');
    handleMenuClose();
  };

  const menuId = 'primary-search-account-menu';
  const mobileMenuId = 'primary-search-account-menu-mobile';

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #9c27b0 0%, #00bcd4 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="home"
              onClick={() => navigate('/')}
              sx={{ mr: 2 }}
            >
              <PhotoCameraIcon />
            </IconButton>
          </motion.div>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 600,
            }}
            onClick={() => navigate('/')}
          >
            Photo Gallery BHEL
          </Typography>

          {isMobile ? (
            <>
              <IconButton
                size="large"
                aria-label="show more"
                aria-controls={mobileMenuId}
                aria-haspopup="true"
                onClick={handleMobileMenuOpen}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={mobileMenuAnchor}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                id={mobileMenuId}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(mobileMenuAnchor)}
                onClose={handleMenuClose}
              >
                {isAuthenticated ? (
                  [
                    ...(!isOnUploadPage ? [
                      <MenuItem key="upload" onClick={handleUpload}>
                        Upload Photos
                      </MenuItem>,
                      <MenuItem key="admin" onClick={handleAdmin}>
                        Admin Dashboard
                      </MenuItem>,
                    ] : []),
                    <MenuItem key="profile" onClick={handleProfileMenuOpen}>
                      Profile
                    </MenuItem>,
                    <MenuItem key="logout" onClick={handleLogout}>
                      Logout
                    </MenuItem>,
                  ]
                ) : (
                  <MenuItem onClick={openLoginModal}>
                    Login
                  </MenuItem>
                )}
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isAuthenticated ? (
                <>
                  {!isOnUploadPage && (
                    <>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          color="inherit"
                          onClick={handleUpload}
                          sx={{ fontWeight: 500 }}
                        >
                          Upload Photos
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          color="inherit"
                          onClick={handleAdmin}
                          sx={{ fontWeight: 500 }}
                        >
                          Admin
                        </Button>
                      </motion.div>
                    </>
                  )}
                  
                  <IconButton
                    edge="end"
                    aria-label="account of current user"
                    aria-controls={menuId}
                    aria-haspopup="true"
                    onClick={handleProfileMenuOpen}
                    color="inherit"
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                      {user?.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    color="inherit"
                    startIcon={<AccountCircle />}
                    onClick={openLoginModal}
                    sx={{ fontWeight: 500 }}
                  >
                    Login
                  </Button>
                </motion.div>
              )}
            </Box>
          )}

          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            id={menuId}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              {user?.username} ({user?.role})
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </motion.div>
  );
};

export default Navbar; 