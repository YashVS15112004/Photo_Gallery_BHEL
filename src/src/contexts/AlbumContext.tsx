import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface AlbumContextType {
  albums: Album[];
  isLoading: boolean;
  error: string | null;
  fetchAlbums: () => Promise<void>;
  createAlbum: (name: string, description?: string) => Promise<Album | null>;
  updateAlbum: (id: string, data: Partial<Album>) => Promise<boolean>;
  deleteAlbum: (id: string) => Promise<boolean>;
  setThumbnail: (albumId: string, imageId: string) => Promise<boolean>;
  toggleAlbumVisibility: (id: string) => Promise<boolean>;
}

const AlbumContext = createContext<AlbumContextType | undefined>(undefined);

export const useAlbums = () => {
  const context = useContext(AlbumContext);
  if (context === undefined) {
    throw new Error('useAlbums must be used within an AlbumProvider');
  }
  return context;
};

interface AlbumProviderProps {
  children: ReactNode;
}

export const AlbumProvider: React.FC<AlbumProviderProps> = ({ children }) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbums = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/albums');
      console.log('Fetched albums:', response.data.albums);
      setAlbums(response.data.albums);
    } catch (err) {
      setError('Failed to fetch albums');
      console.error('Error fetching albums:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createAlbum = async (name: string, description?: string): Promise<Album | null> => {
    try {
      console.log('Creating album with data:', { name, description });
      const response = await api.post('/albums', { name, description });
      console.log('Album created successfully:', response.data);
      const newAlbum = response.data.album;
      setAlbums(prev => [...prev, newAlbum]);
      return newAlbum;
    } catch (err) {
      setError('Failed to create album');
      console.error('Error creating album:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
      }
      return null;
    }
  };

  const updateAlbum = async (id: string, data: Partial<Album>): Promise<boolean> => {
    try {
      const response = await api.put(`/albums/${id}`, data);
      const updatedAlbum = response.data.album;
      setAlbums(prev => prev.map(album => 
        album._id === id ? updatedAlbum : album
      ));
      return true;
    } catch (err) {
      setError('Failed to update album');
      console.error('Error updating album:', err);
      return false;
    }
  };

  const deleteAlbum = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/albums/${id}`);
      setAlbums(prev => prev.filter(album => album._id !== id));
      return true;
    } catch (err) {
      setError('Failed to delete album');
      console.error('Error deleting album:', err);
      return false;
    }
  };

  const setThumbnail = async (albumId: string, imageId: string): Promise<boolean> => {
    try {
      const response = await api.put(`/albums/${albumId}/thumbnail`, { imageId });
      const updatedAlbum = response.data.album;
      setAlbums(prev => prev.map(album => 
        album._id === albumId ? updatedAlbum : album
      ));
      return true;
    } catch (err) {
      setError('Failed to set thumbnail');
      console.error('Error setting thumbnail:', err);
      return false;
    }
  };

  const toggleAlbumVisibility = async (id: string): Promise<boolean> => {
    try {
      const response = await api.put(`/albums/${id}/visibility`);
      const updatedAlbum = response.data.album;
      setAlbums(prev => prev.map(album => 
        album._id === id ? updatedAlbum : album
      ));
      return true;
    } catch (err) {
      setError('Failed to toggle album visibility');
      console.error('Error toggling album visibility:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const value: AlbumContextType = {
    albums,
    isLoading,
    error,
    fetchAlbums,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    setThumbnail,
    toggleAlbumVisibility,
  };

  return (
    <AlbumContext.Provider value={value}>
      {children}
    </AlbumContext.Provider>
  );
}; 