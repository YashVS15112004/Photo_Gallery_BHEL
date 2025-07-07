import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Eye, EyeOff, Image, User } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { formatDate } from '../lib/utils'
import api from '../lib/api'
import { Album } from '../types'
import toast from 'react-hot-toast'

export function Albums() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const queryClient = useQueryClient()

  const { data: albums, isLoading } = useQuery({
    queryKey: ['admin-albums'],
    queryFn: async () => {
      const response = await api.get('/admin/albums')
      return response.data.albums
    },
  })

  const deleteAlbumMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/albums/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-albums'] })
      toast.success('Album deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete album')
    },
  })

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isHidden }: { id: string; isHidden: boolean }) =>
      api.put(`/admin/albums/${id}`, { isHidden }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-albums'] })
      toast.success('Album visibility updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update album')
    },
  })

  const handleDeleteAlbum = (album: Album) => {
    if (window.confirm(`Are you sure you want to delete album "${album.name}"? This will also delete all images in the album.`)) {
      deleteAlbumMutation.mutate(album._id)
    }
  }

  const handleToggleVisibility = (album: Album) => {
    toggleVisibilityMutation.mutate({ id: album._id, isHidden: !album.isHidden })
  }

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate paginated albums
  const paginatedAlbums = albums ? albums.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];
  const totalPages = albums ? Math.ceil(albums.length / itemsPerPage) : 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Album Management</h1>
        <p className="text-gray-600">Manage all albums in the system</p>
      </div>

      {/* Albums Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.no.</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Album ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Album Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Album Description</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created by</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created when</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Visible</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedAlbums.map((album: Album, idx: number) => (
              <tr key={album._id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{idx + 1}</td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 font-mono">{album._id}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900">{album.name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">{album.description || '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{album.createdBy?.username || 'Unknown'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{formatDate(album.createdAt)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  <Button
                    variant={album.isHidden ? 'outline' : 'success'}
                    size="sm"
                    onClick={() => handleToggleVisibility(album)}
                    title={album.isHidden ? 'Show Album' : 'Hide Album'}
                  >
                    {album.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteAlbum(album)}
                    title="Delete Album"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!albums || albums.length === 0) && (
        <div className="p-8 text-center">
          <Image className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No albums</h3>
          <p className="mt-1 text-sm text-gray-500">
            No albums have been created yet.
          </p>
        </div>
      )}

      {/* Add pagination controls below the table */}
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          {'<'}
        </button>
        <span className="mx-2 text-sm">Page {currentPage} of {totalPages}</span>
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          {'>'}
        </button>
      </div>
    </div>
  )
} 