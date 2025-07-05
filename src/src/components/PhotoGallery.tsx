import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Skeleton,
  Alert,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  TextField,
  Divider,
  CardActions,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
} from '@mui/material';
import {
  PhotoLibrary as PhotoLibraryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Collections as CollectionsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAlbums } from '../contexts/AlbumContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

// Import Album interface from AlbumContext
interface Album {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  images: any[];
  thumbnail?: any;
  isHidden: boolean;
  createdAt: string;
}

const PhotoGallery: React.FC = () => {
  const { albums, isLoading, error, updateAlbum, deleteAlbum, toggleAlbumVisibility, setThumbnail } = useAlbums();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [showHiddenAlbums, setShowHiddenAlbums] = useState(false);

  const handleAlbumClick = (albumId: string) => {
    navigate(`/album/${albumId}`);
  };

  const handleUploadClick = () => {
    navigate('/upload');
  };

  const handleEditAlbum = async (albumId: string) => {
    const album = albums.find(a => a._id === albumId);
    if (album) {
      console.log('Editing album:', album);
      console.log('Album images:', album.images);
      
      // Check if images are just IDs (strings) or full objects
      if (album.images.length > 0 && typeof album.images[0] === 'string') {
        console.log('Images are IDs, fetching full image data...');
        try {
          // Fetch full album data with images
          const response = await api.get(`/albums/${albumId}`);
          const fullAlbum = response.data.album;
          console.log('Full album with images:', fullAlbum);
          setEditingAlbum(fullAlbum);
        } catch (error) {
          console.error('Failed to fetch full album data:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load album images',
            severity: 'error'
          });
          // Still open dialog with basic album data
          setEditingAlbum(album);
        }
      } else {
        console.log('Images are already full objects');
        setEditingAlbum(album);
      }
      
      setEditDialogOpen(true);
    }
  };

  const handleSaveAlbum = async (updatedAlbum: Partial<Album>) => {
    if (!editingAlbum) return;
    
    setIsSaving(true);
    try {
      console.log('Saving album with data:', updatedAlbum);
      
      // Prepare the data to send to the backend
      const albumData = {
        name: updatedAlbum.name,
        description: updatedAlbum.description,
        // Note: We might need to handle image updates separately
        // as the backend might not support updating images array directly
      };
      
      const success = await updateAlbum(editingAlbum._id, albumData);
      if (success) {
        setSnackbar({
          open: true,
          message: 'Album details updated successfully',
          severity: 'success'
        });
        setEditDialogOpen(false);
        setEditingAlbum(null);
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to update album',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving album:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update album',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetThumbnail = async (imageId: string) => {
    if (!editingAlbum) return;
    
    try {
      console.log('Setting thumbnail for image:', imageId);
      const success = await setThumbnail(editingAlbum._id, imageId);
      if (success) {
        setSnackbar({
          open: true,
          message: 'Thumbnail updated successfully',
          severity: 'success'
        });
        // Update the local editing album state
        setEditingAlbum(prev => prev ? {
          ...prev,
          thumbnail: prev.images.find(img => img._id === imageId)
        } : null);
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to update thumbnail',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update thumbnail',
        severity: 'error'
      });
    }
  };

  const handleUpdateImageCaption = async (imageId: string, caption: string) => {
    if (!editingAlbum) return;
    
    try {
      console.log('Updating caption for image:', imageId, 'Caption:', caption);
      
      // Update the local state immediately for better UX
      setEditingAlbum(prev => prev ? {
        ...prev,
        images: prev.images.map(img => 
          img._id === imageId ? { ...img, caption } : img
        )
      } : null);
      
      // For now, we'll just update the local state
      // In the future, you might want to send this to the backend
      setSnackbar({
        open: true,
        message: 'Image caption updated',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating image caption:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update image caption',
        severity: 'error'
      });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!editingAlbum) return;
    
    try {
      // Remove image from the album
      const updatedImages = editingAlbum.images.filter(img => img._id !== imageId);
      const success = await updateAlbum(editingAlbum._id, { images: updatedImages });
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Image deleted successfully',
          severity: 'success'
        });
        // Update the local editing album state
        setEditingAlbum(prev => prev ? {
          ...prev,
          images: updatedImages
        } : null);
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to delete image',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete image',
        severity: 'error'
      });
    }
  };

  const handleDeleteAlbum = (albumId: string) => {
    setAlbumToDelete(albumId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return;
    
    try {
      const success = await deleteAlbum(albumToDelete);
      if (success) {
        setSnackbar({
          open: true,
          message: 'Album deleted successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to delete album',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete album',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setAlbumToDelete(null);
    }
  };

  const handleToggleVisibility = async (albumId: string, currentVisibility: boolean) => {
    try {
      const success = await toggleAlbumVisibility(albumId);
      if (success) {
        setSnackbar({
          open: true,
          message: `Album ${currentVisibility ? 'shown' : 'hidden'} successfully`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to toggle album visibility',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to toggle album visibility',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
          Photo Gallery
        </Typography>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Container>
    );
  }

  const visibleAlbums = albums.filter(album => !album.isHidden);
  const hiddenAlbums = albums.filter(album => album.isHidden);
  const displayedAlbums = showHiddenAlbums ? hiddenAlbums : visibleAlbums;

  const port = window.location.port;
  const showTable = port === "3001";
  const showCards = port === "3000";

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>

        {displayedAlbums.length === 0 ? (
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
              <PhotoLibraryIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No albums available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Albums will appear here once they are created and made visible.
              </Typography>
            </Box>
          </motion.div>
        ) : (
          showTable ? (
            // --- TABLE LAYOUT (admin/portal) ---
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>S.No.</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Album Thumbnail</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Album Name</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Photos</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {displayedAlbums.map((album, index) => (
                        <motion.tr
                          key={album._id}
                          variants={itemVariants}
                          component={TableRow}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Avatar
                              src={album.thumbnail?.path || (album.images[0]?.path) || '/placeholder-album.jpg'}
                              alt={album.name}
                              sx={{ width: 60, height: 60, cursor: 'pointer' }}
                              onClick={() => handleAlbumClick(album._id)}
                              onError={(e) => {
                                console.error('Image failed to load:', album.thumbnail?.path);
                                e.currentTarget.src = '/placeholder-album.jpg';
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {album.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {album.description || 'No description'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${album.images.length} photos`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={album.isHidden ? "Hidden" : "Visible"}
                              size="small"
                              color={album.isHidden ? "error" : "success"}
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleAlbumClick(album._id)}
                                title="View Album"
                              >
                                <ViewIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleEditAlbum(album._id)}
                                title="Edit Album"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color={album.isHidden ? "success" : "warning"}
                                onClick={() => handleToggleVisibility(album._id, album.isHidden)}
                                title={album.isHidden ? "Show Album" : "Hide Album"}
                              >
                                {album.isHidden ? <VisibilityIcon /> : <VisibilityOffIcon />}
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteAlbum(album._id)}
                                title="Delete Album"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </TableContainer>
            </motion.div>
          ) : (
            // --- CARD LAYOUT (public/gallery) ---
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
              width: '100%'
            }}>
              <AnimatePresence>
                {displayedAlbums.map((album, index) => {
                  // Determine thumbnail image
                  let thumbnail = album.thumbnail?.path;
                  if (!thumbnail && album.images && album.images.length > 0) {
                    thumbnail = album.images[0].path;
                  }
                  if (!thumbnail) {
                    thumbnail = '/placeholder-album.jpg';
                  }
                  return (
                    <motion.div
                      key={album._id}
                      variants={itemVariants}
                      whileHover={{ 
                        scale: 1.02,
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        elevation={0}
                        sx={{
                          height: '100%',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: 4,
                          border: '1px solid',
                          borderColor: 'divider',
                          background: 'linear-gradient(145deg, #23232b 0%, #181820 100%)',
                          color: 'white',
                          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 20px 40px rgba(156, 39, 176, 0.15)',
                            borderColor: 'primary.main',
                          },
                        }}
                        onClick={() => handleAlbumClick(album._id)}
                      >
                        {/* Album Thumbnail */}
                        <Box sx={{ position: 'relative', height: 240, overflow: 'hidden', bgcolor: '#111' }}>
                          <img
                            src={thumbnail}
                            alt={album.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                            onError={e => {
                              e.currentTarget.src = '/placeholder-album.jpg';
                            }}
                          />
                        </Box>
                        {/* Album Info */}
                        <Box sx={{ p: 3, pt: 2, pb: 2, textAlign: 'center', bgcolor: 'transparent' }}>
                          <Typography 
                            variant="h6" 
                            sx={{ fontWeight: 700, mb: 0.5, color: 'white', letterSpacing: 1 }}
                          >
                            {album.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ color: 'grey.400', mb: 2, fontWeight: 400 }}
                          >
                            {album.description || 'No description'}
                          </Typography>
                          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                            <PhotoLibraryIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            <Chip
                              label={`${album.images.length} images`}
                              size="small"
                              sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                px: 1.5,
                              }}
                            />
                          </Box>
                          <Box display="flex" justifyContent="flex-end" alignItems="center" mt={2}>
                            <Typography variant="caption" sx={{ color: 'grey.400', fontWeight: 500 }}>
                              by {album.createdBy?.username || 'unknown'}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Box>
          )
        )}
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this album? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteAlbum} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Album Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="edit-dialog-title"
      >
        <DialogTitle id="edit-dialog-title">
          Edit Album: {editingAlbum?.name}
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          {editingAlbum && (
            <Box sx={{ mt: 2 }}>
              {/* Debug Info */}
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Debug: Album has {editingAlbum.images?.length || 0} images
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Images: {JSON.stringify(editingAlbum.images?.map(img => ({ id: img._id, filename: img.filename, hasPath: !!img.path, allProps: Object.keys(img) })))}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  First image path: {editingAlbum.images?.[0]?.path || 'No path'}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  First image full object: {JSON.stringify(editingAlbum.images?.[0])}
                </Typography>
              </Box>
              {/* Album Details Section */}
              <Typography variant="h6" gutterBottom>
                Album Details
              </Typography>
              <TextField
                fullWidth
                label="Album Name"
                defaultValue={editingAlbum.name}
                margin="normal"
                onChange={(e) => setEditingAlbum(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
              <TextField
                fullWidth
                label="Album Description"
                defaultValue={editingAlbum.description || ''}
                margin="normal"
                multiline
                rows={3}
                onChange={(e) => setEditingAlbum(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
              
              <Divider sx={{ my: 3 }} />
              
              {/* Images Section */}
              <Typography variant="h6" gutterBottom>
                Images ({editingAlbum.images?.length || 0})
              </Typography>
              
              {/* Test Image Display */}
              {editingAlbum.images?.[0] && (
                <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Test: First Image ({typeof editingAlbum.images[0] === 'string' ? 'ID' : 'Object'})
                  </Typography>
                  {typeof editingAlbum.images[0] === 'string' ? (
                    <Typography variant="body2" color="text.secondary">
                      Image ID: {editingAlbum.images[0]}
                    </Typography>
                  ) : (
                    <img 
                      src={(() => {
                        const image = editingAlbum.images[0];
                        const possiblePaths = [
                          image.path,
                          image.url,
                          image.src,
                          image.imagePath,
                          image.filePath,
                          `/uploads/${image.filename}`,
                          `/images/${image._id}`,
                          `/albums/${editingAlbum._id}/images/${image._id}`
                        ];
                        
                        for (const path of possiblePaths) {
                          if (path && typeof path === 'string') {
                            return path.startsWith('http') ? path : path;
                          }
                        }
                        
                        return '/placeholder-album.jpg';
                      })()}
                      alt={editingAlbum.images[0].filename || 'Test image'}
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      onError={(e) => {
                        console.error('Test image failed to load. Image object:', editingAlbum.images[0]);
                        e.currentTarget.src = '/placeholder-album.jpg';
                      }}
                    />
                  )}
                </Box>
              )}
              
              {!editingAlbum.images || editingAlbum.images.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  minHeight="200px"
                  textAlign="center"
                  sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3 }}
                >
                  <PhotoLibraryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No images in this album
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Images will appear here once they are uploaded to this album.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {editingAlbum.images && editingAlbum.images.length > 0 ? (
                    editingAlbum.images.filter(image => {
                      // Handle both string IDs and full objects
                      if (typeof image === 'string') {
                        return image && image.length > 0;
                      }
                      return image && image._id;
                    }).map((image, index) => {
                      // If image is just an ID string, show placeholder
                      if (typeof image === 'string') {
                        return (
                          <Grid item xs={12} sm={6} md={4} key={image}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                              <CardMedia
                                component="img"
                                height="200"
                                image="/placeholder-album.jpg"
                                alt="Loading image..."
                                sx={{ 
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                }}
                              />
                              <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                  Image {index + 1} of {editingAlbum.images.length} (ID: {image})
                                </Typography>
                                <TextField
                                  fullWidth
                                  label="Image Caption"
                                  defaultValue=""
                                  size="small"
                                  margin="dense"
                                  placeholder="Loading image data..."
                                  disabled
                                />
                              </CardContent>
                              <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
                                <Button
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  disabled
                                >
                                  Loading...
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  disabled
                                >
                                  Delete
                                </Button>
                              </CardActions>
                            </Card>
                          </Grid>
                        );
                      }
                      
                      // Full image object
                      return (
                  <Grid item xs={12} sm={6} md={4} key={image._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={(() => {
                          // Try different possible path properties
                          const possiblePaths = [
                            image.path,
                            image.url,
                            image.src,
                            image.imagePath,
                            image.filePath,
                            `/uploads/${image.filename}`,
                            `/images/${image._id}`,
                            `/albums/${editingAlbum._id}/images/${image._id}`
                          ];
                          
                          for (const path of possiblePaths) {
                            if (path && typeof path === 'string') {
                              return path.startsWith('http') ? path : path;
                            }
                          }
                          
                          return '/placeholder-album.jpg';
                        })()}
                        alt={image.filename || 'Album image'}
                        sx={{ 
                          objectFit: 'cover',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            transition: 'transform 0.2s ease',
                          }
                        }}
                        onClick={() => {
                          const imageUrl = (() => {
                            const possiblePaths = [
                              image.path,
                              image.url,
                              image.src,
                              image.imagePath,
                              image.filePath,
                              `/uploads/${image.filename}`,
                              `/images/${image._id}`,
                              `/albums/${editingAlbum._id}/images/${image._id}`
                            ];
                            
                            for (const path of possiblePaths) {
                              if (path && typeof path === 'string') {
                                return path.startsWith('http') ? path : path;
                              }
                            }
                            
                            return '/placeholder-album.jpg';
                          })();
                          window.open(imageUrl, '_blank');
                        }}
                        onError={(e) => {
                          console.error('Image failed to load. Image object:', image);
                          e.currentTarget.src = '/placeholder-album.jpg';
                        }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Image {index + 1} of {editingAlbum.images.length}
                        </Typography>
                        <TextField
                          fullWidth
                          label="Image Caption"
                          defaultValue={image.caption || ''}
                          size="small"
                          margin="dense"
                          placeholder="Add a caption for this image..."
                          onChange={(e) => {
                            handleUpdateImageCaption(image._id, e.target.value);
                          }}
                        />
                        {editingAlbum.thumbnail?._id === image._id && (
                          <Chip
                            label="Current Thumbnail"
                            size="small"
                            color="success"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
                        <Button
                          size="small"
                          color={editingAlbum.thumbnail?._id === image._id ? "success" : "primary"}
                          onClick={() => handleSetThumbnail(image._id)}
                          disabled={editingAlbum.thumbnail?._id === image._id}
                          variant={editingAlbum.thumbnail?._id === image._id ? "contained" : "outlined"}
                        >
                          {editingAlbum.thumbnail?._id === image._id ? "✓ Thumbnail" : "Set Thumbnail"}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleDeleteImage(image._id)}
                        >
                          Delete
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
                    })
                  ) : (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        No valid images found in this album.
                      </Typography>
                    </Grid>
                  )}
              </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={() => editingAlbum && handleSaveAlbum(editingAlbum)} 
            color="primary" 
            variant="contained"
            disabled={!editingAlbum || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Album Details'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PhotoGallery; 