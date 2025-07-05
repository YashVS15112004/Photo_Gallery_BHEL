import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tooltip,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Add as AddIcon,
  Image as ImageIcon,
  Collections as CollectionsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Album {
  _id: string;
  name: string;
  description?: string;
  images: Array<{
    _id: string;
    filename: string;
    path: string;
    caption?: string;
  }>;
  isHidden: boolean;
  thumbnail?: {
    path: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    username: string;
  };
}

const AdminDashboard: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [captionDialogOpen, setCaptionDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ _id: string; caption?: string } | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [thumbnailDialogOpen, setThumbnailDialogOpen] = useState(false);
  const [editAlbumData, setEditAlbumData] = useState<{ name: string; description: string } | null>(null);
  const [thumbnailAlbum, setThumbnailAlbum] = useState<Album | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await api.get('/albums');
      setAlbums(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch albums');
      console.error('Error fetching albums:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!window.confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/albums/${albumId}`);
      setAlbums(albums.filter(album => album._id !== albumId));
      showSnackbar('Album deleted successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to delete album', 'error');
      console.error('Error deleting album:', err);
    }
  };

  const handleDeleteImage = async (albumId: string, imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await api.delete(`/albums/${albumId}/images/${imageId}`);
      setAlbums(albums.map(album => {
        if (album._id === albumId) {
          return {
            ...album,
            images: album.images.filter(img => img._id !== imageId)
          };
        }
        return album;
      }));
      showSnackbar('Image deleted successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to delete image', 'error');
      console.error('Error deleting image:', err);
    }
  };

  const handleToggleVisibility = async (albumId: string, currentVisibility: boolean) => {
    try {
      await api.patch(`/albums/${albumId}`, {
        isHidden: !currentVisibility
      });
      setAlbums(albums.map(album => {
        if (album._id === albumId) {
          return { ...album, isHidden: !currentVisibility };
        }
        return album;
      }));
      showSnackbar(`Album ${currentVisibility ? 'hidden' : 'shown'} successfully`, 'success');
    } catch (err) {
      showSnackbar('Failed to update album visibility', 'error');
      console.error('Error updating album visibility:', err);
    }
  };

  const handleEditCaption = (album: Album, image: { _id: string; caption?: string }) => {
    setSelectedAlbum(album);
    setSelectedImage(image);
    setNewCaption(image.caption || '');
    setCaptionDialogOpen(true);
  };

  const handleSaveCaption = async () => {
    if (!selectedAlbum || !selectedImage) return;

    try {
      await api.patch(`/albums/${selectedAlbum._id}/images/${selectedImage._id}`, {
        caption: newCaption
      });
      
      setAlbums(albums.map(album => {
        if (album._id === selectedAlbum._id) {
          return {
            ...album,
            images: album.images.map(img => {
              if (img._id === selectedImage._id) {
                return { ...img, caption: newCaption };
              }
              return img;
            })
          };
        }
        return album;
      }));
      
      showSnackbar('Caption updated successfully', 'success');
      setCaptionDialogOpen(false);
    } catch (err) {
      showSnackbar('Failed to update caption', 'error');
      console.error('Error updating caption:', err);
    }
  };

  const handleEditAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setEditAlbumData({ name: album.name, description: album.description || '' });
    setEditDialogOpen(true);
  };
  const handleSaveEditAlbum = async () => {
    if (!selectedAlbum || !editAlbumData) return;
    try {
      await api.put(`/albums/${selectedAlbum._id}`, editAlbumData);
      setAlbums(albums.map(album => album._id === selectedAlbum._id ? { ...album, ...editAlbumData } : album));
      showSnackbar('Album updated successfully', 'success');
      setEditDialogOpen(false);
    } catch (err) {
      showSnackbar('Failed to update album', 'error');
    }
  };
  const handleSetThumbnail = (album: Album) => {
    setThumbnailAlbum(album);
    setThumbnailDialogOpen(true);
  };
  const handleSaveThumbnail = async (imageId: string) => {
    if (!thumbnailAlbum) return;
    try {
      await api.put(`/albums/${thumbnailAlbum._id}/thumbnail`, { imageId });
      setAlbums(albums.map(album => album._id === thumbnailAlbum._id ? { ...album, thumbnail: { path: thumbnailAlbum.images.find(img => img._id === imageId)?.path || '' } } : album));
      showSnackbar('Thumbnail updated successfully', 'success');
      setThumbnailDialogOpen(false);
    } catch (err) {
      showSnackbar('Failed to update thumbnail', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
          Admin Dashboard
        </Typography>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading albums...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchAlbums}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 600,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #9c27b0 0%, #00bcd4 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Admin Dashboard
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/upload')}
            sx={{ minWidth: 120, fontWeight: 600 }}
          >
            Upload
          </Button>
        </Box>
      </motion.div>

      {albums.length === 0 ? (
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
              Create your first album to get started.
            </Typography>
          </Box>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S.No.</TableCell>
                  <TableCell>Album Thumbnail</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {albums.map((album, idx) => (
                  <TableRow key={album._id} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Tooltip title={album.name} placement="top">
                        <CardMedia
                          component="img"
                          sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover', boxShadow: 1, cursor: 'pointer' }}
                          image={album.thumbnail?.path || '/placeholder-album.jpg'}
                          alt={album.name}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="Set Thumbnail">
                          <IconButton size="small" onClick={() => handleSetThumbnail(album)}>
                            <ImageIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Album">
                          <IconButton size="small" onClick={() => handleEditAlbum(album)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={album.isHidden ? 'Show Album' : 'Hide Album'}>
                          <IconButton size="small" onClick={() => handleToggleVisibility(album._id, album.isHidden)}>
                            {album.isHidden ? <VisibilityIcon /> : <VisibilityOffIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Album">
                          <IconButton size="small" onClick={() => handleDeleteAlbum(album._id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Images Grid for each album */}
          {albums.map((album) => (
            <Box key={`images-${album._id}`} sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Images in "{album.name}"
              </Typography>
              <Grid container spacing={2}>
                {album.images.map((image) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={image._id}>
                    <Card sx={{ height: '100%' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={image.path}
                        alt={image.filename}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent>
                        <Typography variant="body2" noWrap>
                          {image.filename}
                        </Typography>
                        {image.caption && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Caption: {image.caption}
                          </Typography>
                        )}
                        <Box display="flex" gap={1} mt={1}>
                          <Tooltip title="Edit Caption">
                            <IconButton
                              size="small"
                              onClick={() => handleEditCaption(album, image)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Image">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteImage(album._id, image._id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </motion.div>
      )}

      {/* Caption Edit Dialog */}
      <Dialog open={captionDialogOpen} onClose={() => setCaptionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Image Caption</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Caption"
            fullWidth
            variant="outlined"
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCaptionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCaption} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Album Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Album</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Album Name"
            fullWidth
            variant="outlined"
            value={editAlbumData?.name || ''}
            onChange={e => setEditAlbumData(data => data ? { ...data, name: e.target.value } : data)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={editAlbumData?.description || ''}
            onChange={e => setEditAlbumData(data => data ? { ...data, description: e.target.value } : data)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEditAlbum} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      {/* Set Thumbnail Dialog */}
      <Dialog open={thumbnailDialogOpen} onClose={() => setThumbnailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Set Album Thumbnail</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {thumbnailAlbum?.images.map(img => (
              <Grid item xs={4} sm={3} md={2} key={img._id}>
                <Card
                  sx={{ cursor: 'pointer', border: thumbnailAlbum.thumbnail?.path === img.path ? '2px solid #9c27b0' : '2px solid transparent' }}
                  onClick={() => handleSaveThumbnail(img._id)}
                >
                  <CardMedia
                    component="img"
                    height="100"
                    image={img.path}
                    alt={img.filename}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="caption" noWrap>{img.filename}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setThumbnailDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard; 