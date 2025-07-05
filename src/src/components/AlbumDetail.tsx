import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Chip,
  Skeleton,
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlbums } from '../contexts/AlbumContext';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

interface Image {
  _id: string;
  filename: string;
  path: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface Album {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  images: Image[];
  thumbnail?: Image;
  isHidden: boolean;
  createdAt: string;
}

const AlbumDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { albums } = useAlbums();
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await api.get(`/albums/${id}`);
        setAlbum(response.data.album);
      } catch (err) {
        setError('Failed to load album');
        console.error('Error fetching album:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    setSelectedImageIndex(null);
  };

  const handlePrevious = () => {
    if (selectedImageIndex !== null && album) {
      setSelectedImageIndex(selectedImageIndex === 0 ? album.images.length - 1 : selectedImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedImageIndex !== null && album) {
      setSelectedImageIndex(selectedImageIndex === album.images.length - 1 ? 0 : selectedImageIndex + 1);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!lightboxOpen) return;

    switch (e.key) {
      case 'Escape':
        handleCloseLightbox();
        break;
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [lightboxOpen, selectedImageIndex, album]);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Skeleton variant="text" width={200} height={40} />
        </Box>
        <Box display="flex" flexWrap="wrap" gap={3}>
          {[...Array(6)].map((_, index) => (
            <Box key={index} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Skeleton variant="rectangular" height={250} />
                <Box sx={{ p: 2 }}>
                  <Skeleton variant="text" width="60%" />
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    );
  }

  if (error || !album) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Album</Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Album not found'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Gallery
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box display="flex" alignItems="center" mb={3}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          </motion.div>
          <Box flex={1}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              {album.name}
            </Typography>
            {album.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {album.description}
              </Typography>
            )}
            <Chip
              label={`${album.images.length} photos`}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>
      </motion.div>

      {album.images.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="400px"
            textAlign="center"
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No photos in this album
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Photos will appear here once they are uploaded to this album.
            </Typography>
          </Box>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Slideshow Controls */}
          <Box display="flex" justifyContent="center" alignItems="center" mb={3} gap={2}>
            <Button
              variant="outlined"
              onClick={() => setLightboxOpen(true)}
              startIcon={<ZoomInIcon />}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.main',
                  color: 'white',
                },
              }}
            >
              Start Slideshow
            </Button>
            <Typography variant="body2" color="text.secondary">
              {album.images.length} photos • Click any image to view
            </Typography>
          </Box>

          {/* Slideshow Preview */}
          <Box
            sx={{
              position: 'relative',
              height: '60vh',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
            }}
            onClick={() => setLightboxOpen(true)}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImageIndex !== null ? selectedImageIndex : 0}
                src={album.images[selectedImageIndex !== null ? selectedImageIndex : 0].path}
                alt={album.images[selectedImageIndex !== null ? selectedImageIndex : 0].caption || album.images[selectedImageIndex !== null ? selectedImageIndex : 0].filename}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                onError={(e) => {
                  console.error('Image failed to load:', album.images[selectedImageIndex !== null ? selectedImageIndex : 0].path);
                  e.currentTarget.src = '/placeholder-image.jpg';
                }}
              />
            </AnimatePresence>

            {/* Image Info Overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
                color: 'white',
                p: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {album.images[selectedImageIndex !== null ? selectedImageIndex : 0].caption || 'Untitled'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Photo {selectedImageIndex !== null ? selectedImageIndex + 1 : 1} of {album.images.length}
              </Typography>
            </Box>

            {/* Navigation Arrows */}
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
              }}
            >
              <NavigateBeforeIcon />
            </IconButton>
            
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
              }}
            >
              <NavigateNextIcon />
            </IconButton>

            {/* Thumbnail Navigation */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 80,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
                maxWidth: '80%',
                overflowX: 'auto',
                p: 1,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 2,
              }}
            >
              {album.images.map((image, index) => (
                <Box
                  key={image._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(index);
                  }}
                  sx={{
                    width: 60,
                    height: 40,
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: index === (selectedImageIndex !== null ? selectedImageIndex : 0) ? '2px solid white' : '2px solid transparent',
                    opacity: index === (selectedImageIndex !== null ? selectedImageIndex : 0) ? 1 : 0.7,
                    '&:hover': { opacity: 1 },
                  }}
                >
                  <img
                    src={image.path}
                    alt={image.caption || image.filename}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.jpg';
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </motion.div>
      )}

      {/* Lightbox */}
      <Dialog
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            boxShadow: 'none',
            borderRadius: 0,
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {selectedImageIndex !== null && album && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80vh',
                position: 'relative',
              }}
            >
              <img
                src={album.images[selectedImageIndex].path}
                alt={album.images[selectedImageIndex].caption || album.images[selectedImageIndex].filename}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />
              
              {/* Navigation buttons */}
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                }}
              >
                <NavigateBeforeIcon />
              </IconButton>
              
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                }}
              >
                <NavigateNextIcon />
              </IconButton>
              
              {/* Close button */}
              <IconButton
                onClick={handleCloseLightbox}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                }}
              >
                <CloseIcon />
              </IconButton>
              
              {/* Image info */}
              {album.images[selectedImageIndex].caption && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    right: 16,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body1">
                    {album.images[selectedImageIndex].caption}
                  </Typography>
                </Box>
              )}
              
              {/* Image counter */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2">
                  {selectedImageIndex + 1} / {album.images.length}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default AlbumDetail; 