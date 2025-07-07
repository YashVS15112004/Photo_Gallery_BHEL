import React, { useState, useEffect, useRef } from 'react';
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
  totalImages: number;
  images: Image[];
  offset: number;
  limit: number;
}

const IMAGES_BATCH_SIZE = 10;

const AlbumDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { albums } = useAlbums();
  const [album, setAlbum] = useState<Album | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [totalImages, setTotalImages] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageWidth, setImageWidth] = useState<number | undefined>(undefined);

  // Fetch a batch of images
  const fetchImagesBatch = async (batchOffset: number) => {
    try {
      if (batchOffset === 0) setIsLoading(true);
      else setIsLoadingMore(true);
      const response = await api.get(`/albums/${id}?offset=${batchOffset}&limit=${IMAGES_BATCH_SIZE}`);
      const { album: albumData, hasMore: more, totalImages: total, offset: newOffset } = response.data;
      if (batchOffset === 0) {
        setAlbum(albumData);
        setImages(albumData.images);
        setTotalImages(albumData.totalImages);
        setOffset(albumData.images.length);
        setHasMore(more);
      } else {
        setImages(prev => [...prev, ...albumData.images]);
        setOffset(prev => prev + albumData.images.length);
        setHasMore(more);
      }
    } catch (err) {
      setError('Failed to load album');
      console.error('Error fetching album:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (id) fetchImagesBatch(0);
    // eslint-disable-next-line
  }, [id]);

  // Infinite scroll: fetch next batch if user navigates to last loaded image
  useEffect(() => {
    if (
      hasMore &&
      !isLoadingMore &&
      selectedImageIndex >= images.length - 2 && // prefetch before last image
      images.length < totalImages
    ) {
      fetchImagesBatch(offset);
    }
    // eslint-disable-next-line
  }, [selectedImageIndex, images, hasMore, isLoadingMore, offset, totalImages]);

  // Keyboard navigation
  const handleKeyPress = (e: KeyboardEvent) => {
    if (!album) return;
    switch (e.key) {
      case 'Escape':
        navigate(-1);
        break;
      case 'ArrowLeft':
        setSelectedImageIndex(idx => (idx === 0 ? images.length - 1 : idx - 1));
        break;
      case 'ArrowRight':
        setSelectedImageIndex(idx => (idx === images.length - 1 ? 0 : idx + 1));
        break;
    }
  };
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line
  }, [album, images]);

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
        <Button variant="contained" onClick={() => navigate('/')}>Back to Gallery</Button>
      </Container>
    );
  }

  // Only show the slideshow modal (lightbox) as the main/default view
  return (
    <Dialog
      open={true}
      onClose={() => navigate(-1)}
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
      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden' }}>
        {images.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '80vh',
              position: 'relative',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', paddingTop: '64px' }}>
              <img
                ref={imageRef}
                src={images[selectedImageIndex].path}
                alt={images[selectedImageIndex].caption || album.description || album.name || ''}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                }}
                onLoad={() => {
                  if (imageRef.current) setImageWidth(imageRef.current.clientWidth);
                }}
              />
              {/* Navigation buttons */}
              <IconButton
                onClick={() => setSelectedImageIndex(idx => (idx === 0 ? images.length - 1 : idx - 1))}
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
                onClick={() => setSelectedImageIndex(idx => (idx === images.length - 1 ? 0 : idx + 1))}
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
                onClick={() => navigate(-1)}
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
                  {images.length > 0 ? `${selectedImageIndex + 1} / ${totalImages || images.length}` : `0 / 0`}
                </Typography>
              </Box>
            </Box>
            {/* Caption at bottom center, overlays image and matches width */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: '50%',
                  bottom: 0,
                  transform: 'translateX(-50%)',
                  width: imageWidth ? `${imageWidth}px` : 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    px: 3,
                    py: 1,
                    borderRadius: 0,
                    fontWeight: 500,
                    width: '100%',
                    maxWidth: '100%',
                    textAlign: 'center',
                  }}
                >
                  {images[selectedImageIndex].caption || album.description || album.name || ''}
                </Typography>
              </Box>
            </Box>
            {/* Thumbnail strip at bottom */}
            <Box
              sx={{
                mt: 3,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflowX: 'auto',
                gap: 1,
                pb: 2,
              }}
            >
              {images.map((image, index) => (
                <Box
                  key={image._id}
                  onClick={() => setSelectedImageIndex(index)}
                  sx={{
                    width: 60,
                    height: 40,
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: index === selectedImageIndex ? '2px solid white' : '2px solid transparent',
                    opacity: index === selectedImageIndex ? 1 : 0.7,
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
                  />
                </Box>
              ))}
              {isLoadingMore && (
                <Box sx={{ width: 60, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Skeleton variant="rectangular" width={60} height={40} />
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AlbumDetail; 