import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const LoginModal: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, loginModalOpen, closeLoginModal } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    closeLoginModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(username.trim(), password);
      if (success) {
        closeLoginModal();
        setUsername('');
        setPassword('');
        navigate('/upload'); // Redirect to /upload after successful login
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <AnimatePresence>
      {loginModalOpen && (
        <Dialog
          open={loginModalOpen}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                Welcome to Photo Gallery BHEL
              </Typography>
              {isAuthenticated && (
                <IconButton
                  aria-label="close"
                  onClick={handleClose}
                  sx={{
                    color: 'grey.500',
                    '&:hover': { color: 'grey.300' },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              )}
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please login to access the photo gallery and upload features.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                autoFocus
                margin="dense"
                label="Username"
                type="text"
                fullWidth
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                sx={{ mb: 2 }}
                InputProps={{
                  sx: {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />

              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                sx={{ mb: 3 }}
                InputProps={{
                  sx: {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              variant="contained"
              fullWidth
              size="large"
              sx={{
                background: 'linear-gradient(135deg, #9c27b0 0%, #00bcd4 100%)',
                color: 'white',
                fontWeight: 600,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #7b1fa2 0%, #0097a7 100%)',
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Login'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default LoginModal; 