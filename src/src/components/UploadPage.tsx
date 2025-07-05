import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Grid,
  CardMedia,
  CardActions,
  Snackbar,
  Skeleton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Image as ImageIcon,
  PhotoLibrary as PhotoLibraryIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useAlbums } from '../contexts/AlbumContext';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadFile {
  file: File;
  preview: string;
  caption: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

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

const UploadPage: React.FC = () => {
  const { albums, createAlbum, updateAlbum, deleteAlbum, toggleAlbumVisibility, setThumbnail } = useAlbums();
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: '',
      progress: 0,
      status: 'uploading' as const,
    }));
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
  });

  const handleUpload = async () => {
    if (!selectedAlbum || uploadFiles.length === 0) {
      console.log('Upload validation failed:', { selectedAlbum, uploadFilesLength: uploadFiles.length });
      return;
    }

    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      setSnackbar({
        open: true,
        message: 'Please log in to upload photos',
        severity: 'error'
      });
      return;
    }
    console.log('Authentication token found:', token.substring(0, 20) + '...');

    console.log('Starting upload...', { selectedAlbum, files: uploadFiles.map(f => f.file.name) });
    setIsUploading(true);
    const formData = new FormData();
    formData.append('albumId', selectedAlbum);
    
    // Get the selected album to access its description
    const selectedAlbumData = albums.find(album => album._id === selectedAlbum);
    const albumDescription = selectedAlbumData?.description || '';
    
    uploadFiles.forEach((uploadFile, index) => {
      formData.append('images', uploadFile.file);
      // Use album description as fallback if caption is empty
      const caption = uploadFile.caption.trim() || albumDescription;
      formData.append(`captions[${index}]`, caption);
    });

    try {
      console.log('Sending upload request...');
      const response = await api.post('/upload', formData, {
        headers: {
          // Don't set Content-Type manually for FormData - let the browser set it with boundary
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          
          console.log('Upload progress:', progress + '%');
          setUploadFiles(prev => prev.map(file => ({
            ...file,
            progress,
            status: progress === 100 ? 'completed' as const : 'uploading' as const,
          })));
        },
      });

      console.log('Upload successful:', response.data);
      setUploadFiles([]);
      setSelectedAlbum('');
      setShowUploadModal(false);
      setSnackbar({
        open: true,
        message: 'Photos uploaded successfully!',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Upload failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      setUploadFiles(prev => prev.map(file => ({
        ...file,
        status: 'error' as const,
        error: error.response?.data?.error || 'Upload failed',
      })));
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Upload failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;

    const album = await createAlbum(newAlbumName.trim(), newAlbumDescription.trim());
    if (album) {
      setShowCreateAlbum(false);
      setNewAlbumName('');
      setNewAlbumDescription('');
      setSnackbar({
        open: true,
        message: 'Album created successfully!',
        severity: 'success'
      });
    }
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

  const handleDeleteAlbum = async (albumId: string) => {
    if (window.confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      const success = await deleteAlbum(albumId);
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
    }
  };

  const handleToggleVisibility = async (albumId: string) => {
    const success = await toggleAlbumVisibility(albumId);
    if (success) {
      setSnackbar({
        open: true,
        message: 'Album visibility updated',
        severity: 'success'
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadFiles([]);
    setSelectedAlbum('');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Album Management
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => setShowCreateAlbum(true)}
            >
              New Album
            </Button>
            <Button
              startIcon={<CloudUploadIcon />}
              variant="contained"
              onClick={openUploadModal}
            >
              Upload Photos
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Albums Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Thumbnail</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Images</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {albums.map((album) => (
                  <motion.tr
                    key={album._id}
                    component={TableRow}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Avatar
                        sx={{ width: 50, height: 50 }}
                        variant="rounded"
                      >
                        {album.thumbnail?.path || (album.images.length > 0 && album.images[0]?.path) ? (
                          <img
                            src={album.thumbnail?.path || album.images[0]?.path}
                            alt={album.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              console.error('Thumbnail failed to load:', album.thumbnail?.path || album.images[0]?.path);
                              e.currentTarget.src = '/placeholder-album.jpg';
                            }}
                          />
                        ) : (
                          <ImageIcon />
                        )}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {album.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
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
                      <Typography variant="body2">
                        {album.author?.username || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={album.isHidden ? 'Hidden' : 'Visible'}
                        size="small"
                        color={album.isHidden ? 'error' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEditAlbum(album._id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleVisibility(album._id)}
                        >
                          {album.isHidden ? (
                            <VisibilityOffIcon fontSize="small" />
                          ) : (
                            <VisibilityIcon fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAlbum(album._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog 
        open={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Upload Photos</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Album
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
              <Grid container spacing={1}>
                {albums.map((album) => {
                  const isSelected = selectedAlbum === album._id;
                  const thumbnail = album.thumbnail?.path || (album.images.length > 0 && album.images[0]?.path) || '/placeholder-album.jpg';
                  
                  return (
                    <Grid item xs={12} sm={6} key={album._id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: isSelected ? 2 : 1,
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          bgcolor: isSelected ? 'primary.light' : 'background.paper',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: isSelected ? 'primary.light' : 'action.hover',
                          },
                          transition: 'all 0.2s',
                        }}
                        onClick={() => {
                          console.log('Album selected:', album._id);
                          setSelectedAlbum(album._id);
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
                          <Avatar
                            src={thumbnail}
                            sx={{ width: 50, height: 50, mr: 1.5 }}
                            variant="rounded"
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={600} noWrap>
                              {album.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {album.description || 'No description'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <PhotoLibraryIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {album.images.length} photos
                              </Typography>
                            </Box>
                          </Box>
                          {isSelected && (
                            <Box sx={{ color: 'primary.main' }}>
                              <VisibilityIcon />
                            </Box>
                          )}
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
              {albums.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No albums available. Create an album first.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {selectedAlbum && (
            <>
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: isDragActive ? 'action.hover' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop files here' : 'Drag & drop images here'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or click to select files
                </Typography>
              </Box>

              {uploadFiles.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Selected Files ({uploadFiles.length})
                  </Typography>
                  
                  {uploadFiles.map((uploadFile, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Box display="flex" gap={2} alignItems="center">
                        <img
                          src={uploadFile.preview}
                          alt="preview"
                          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={600}>
                            {uploadFile.file.name}
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Add caption (optional)"
                            value={uploadFile.caption}
                            onChange={(e) => {
                              setUploadFiles(prev => prev.map((file, i) =>
                                i === index ? { ...file, caption: e.target.value } : file
                              ));
                            }}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeFile(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      
                      {uploadFile.status === 'uploading' && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress variant="determinate" value={uploadFile.progress} />
                          <Typography variant="caption" color="text.secondary">
                            {uploadFile.progress}% uploaded
                          </Typography>
                        </Box>
                      )}
                      
                      {uploadFile.status === 'error' && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {uploadFile.error}
                        </Alert>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadModal(false)}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || !selectedAlbum || uploadFiles.length === 0}
            variant="contained"
          >
            {isUploading ? 'Uploading...' : 'Upload Photos'}
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
                <Grid container spacing={1}>
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
                          <Grid item xs={1.2} sm={1.2} md={1.2} lg={1.2} xl={1.2} key={image}>
                            <Box sx={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee', borderRadius: 1, overflow: 'hidden', bgcolor: 'grey.100' }}>
                              <img
                                src="/placeholder-album.jpg"
                                alt="Loading image..."
                                style={{ width: 60, height: 60, objectFit: 'cover', display: 'block' }}
                              />
                            </Box>
                          </Grid>
                        );
                      }
                      // Full image object
                      return (
                        <Grid item xs={1.2} sm={1.2} md={1.2} lg={1.2} xl={1.2} key={image._id}>
                          <Box sx={{ width: 60, height: 60, position: 'relative', border: '1px solid #eee', borderRadius: 1, overflow: 'hidden', bgcolor: 'grey.100', mb: 0.5 }}>
                            <img
                              src={(() => {
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
                              style={{ width: 60, height: 60, objectFit: 'cover', display: 'block', cursor: 'pointer' }}
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
                              onError={e => {
                                e.currentTarget.src = '/placeholder-album.jpg';
                              }}
                            />
                            {editingAlbum.thumbnail?._id === image._id && (
                              <Chip
                                label="Thumbnail"
                                size="small"
                                color="success"
                                sx={{ position: 'absolute', top: 2, left: 2, zIndex: 2, fontSize: 10, height: 18 }}
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <TextField
                              fullWidth
                              size="small"
                              margin="dense"
                              placeholder="Caption"
                              value={image.caption || ''}
                              onChange={(e) => handleUpdateImageCaption(image._id, e.target.value)}
                              sx={{ width: 60, '& .MuiInputBase-input': { fontSize: 10, p: 0.5 } }}
                            />
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                color={editingAlbum.thumbnail?._id === image._id ? 'success' : 'primary'}
                                onClick={() => handleSetThumbnail(image._id)}
                                disabled={editingAlbum.thumbnail?._id === image._id}
                                sx={{ p: 0.5 }}
                              >
                                {editingAlbum.thumbnail?._id === image._id ? '✓' : <PhotoLibraryIcon fontSize="small" />}
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteImage(image._id)}
                                sx={{ p: 0.5 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
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

      {/* Create Album Dialog */}
      <Dialog open={showCreateAlbum} onClose={() => setShowCreateAlbum(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Album</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Album Name"
            fullWidth
            variant="outlined"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newAlbumDescription}
            onChange={(e) => setNewAlbumDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateAlbum(false)}>Cancel</Button>
          <Button onClick={handleCreateAlbum} variant="contained">Create</Button>
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
    </Container>
  );
};

export default UploadPage; 