import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Eye, EyeOff, Key, Check, X, ClipboardCopy } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { formatDate } from '../lib/utils'
import api from '../lib/api'
import { User, CreateUserData, UpdateUserData } from '../types'
import toast from 'react-hot-toast'
import { Dialog } from '../components/ui/Dialog';
import { Tooltip } from '../components/ui/Tooltip';
import * as XLSX from 'xlsx';

export function Users() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState<string | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [resetPasswordModal, setResetPasswordModal] = useState<{ open: boolean, username: string, password: string } | null>(null);
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users')
      return response.data.users
    },
  })

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate paginated users
  const paginatedUsers = users ? users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];
  const totalPages = users ? Math.ceil(users.length / itemsPerPage) : 1;

  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserData) => api.post('/admin/users', userData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowCreateModal(false)
      const pwd = data.data.generatedPassword
      if (pwd) {
        setGeneratedPassword(pwd)
        setShowPassword(variables.username) // Set username for modal and clipboard
        toast.success('User created! Password copied to clipboard.')
        navigator.clipboard.writeText(`${variables.username}\n${pwd}`)
      } else {
        toast.success('User created successfully')
      }
    },
    onError: (error: any) => {
      const err = error.response?.data;
      if (err?.details && Array.isArray(err.details)) {
        toast.error(
          err.details.map((d: any) => d.msg || d.error || JSON.stringify(d)).join('\n')
        );
      } else {
        toast.error(err?.error || 'Failed to create user');
      }
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      api.put(`/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setEditingUser(null)
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user')
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/reset-password`),
    onSuccess: (data, variables, context) => {
      const user = users?.find((u: User) => u._id === context);
      setResetPasswordModal({
        open: true,
        username: user?.username || '',
        password: data.data.newPassword,
      });
      toast.success('Password reset successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reset password')
    },
  })

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Build the userData object
    const userData: any = {
      username: formData.get('username'),
      email: formData.get('email'),
      role: formData.get('role') || 'user',
    };
    // Remove password if present
    if ('password' in userData) {
      delete userData.password;
    }
    // Remove password from FormData as well, just in case
    formData.delete('password');
    console.log('Create User form data:', [...formData.entries()]); // Debug log
    createUserMutation.mutate(userData);
  }

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingUser) return

    const formData = new FormData(e.currentTarget)
    const userData: UpdateUserData = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      role: (formData.get('role') as 'user' | 'admin') || 'user',
      isAuthorized: formData.get('isAuthorized') === 'true',
    }
    updateUserMutation.mutate({ id: editingUser._id, data: userData })
  }

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user "${user.username}"? This will also delete all their albums and images.`)) {
      deleteUserMutation.mutate(user._id)
    }
  }

  const handleResetPassword = (user: User) => {
    if (window.confirm(`Are you sure you want to reset password for user "${user.username}"?`)) {
      resetPasswordMutation.mutate(user._id, { context: user._id });
    }
  }

  const handleExportUsers = () => {
    if (!users || users.length === 0) return;
    const exportData = users.map((user: User) => ({
      Username: user.username,
      Email: user.email,
      Role: user.role,
      Status: user.isAuthorized ? 'Authorized' : 'Pending',
      Created: formatDate(user.createdAt),
      LastLogin: user.lastLogin ? formatDate(user.lastLogin) : 'Never',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    XLSX.writeFile(workbook, 'users.xlsx');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage system users and their permissions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportUsers} tooltip="Export users to Excel">
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)} tooltip="Add a new user">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface dark:bg-surface-dark divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.map((user: User) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isAuthorized 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.isAuthorized ? (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            Authorized
                          </>
                        ) : (
                          <>
                            <X className="mr-1 h-3 w-3" />
                            Pending
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          tooltip="Edit user details"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                          tooltip="Reset user password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        {user.isAuthorized ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to revoke authorization for user '${user.username}'?`)) {
                                updateUserMutation.mutate({ id: user._id, data: { isAuthorized: false } })
                              }
                            }}
                            title="Revoke Authorization"
                          >
                            Revoke
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to authorize user '${user.username}'?`)) {
                                updateUserMutation.mutate({ id: user._id, data: { isAuthorized: true } })
                              }
                            }}
                            title="Authorize User"
                          >
                            Authorize
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          tooltip="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add pagination controls below the table */}
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 disabled:opacity-50 transition-colors"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          {'<'}
        </button>
        <span className="mx-2 text-sm dark:text-gray-300">Page {currentPage} of {totalPages}</span>
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 disabled:opacity-50 transition-colors"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          {'>'}
        </button>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <Input
                  label="Username"
                  name="username"
                  required
                  placeholder="Enter username"
                  defaultValue=""
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter email"
                  defaultValue=""
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select name="role" className="input">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    tooltip="Close dialog"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generated Password Modal */}
      {generatedPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>User Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-center">
                <div className="text-lg font-semibold">Credentials</div>
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-lg select-all dark:text-gray-100">Username: {showPassword}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-lg select-all dark:text-gray-100">Password: {generatedPassword}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${showPassword}\n${generatedPassword}`)
                        toast.success('Username and password copied to clipboard!')
                      }}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">Share these credentials with the user. They should change the password after first login.</div>
                <Button className="mt-4 w-full" onClick={() => setGeneratedPassword(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <Input
                  label="Username"
                  name="username"
                  defaultValue={editingUser.username}
                  required
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  defaultValue={editingUser.email}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select name="role" className="input" defaultValue={editingUser.role}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAuthorized"
                    value="true"
                    defaultChecked={editingUser.isAuthorized}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Authorized
                  </label>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                    tooltip="Close dialog"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {resetPasswordModal?.open && (
        <Dialog open={resetPasswordModal.open} onClose={() => setResetPasswordModal(null)}>
          <div className="p-6">
            <h2 className="text-lg font-bold mb-2">Password Reset</h2>
            <p className="mb-2">The new password for <span className="font-mono">{resetPasswordModal.username}</span> is:</p>
            <div className="flex items-center mb-4">
              <span className="font-mono bg-gray-100 px-3 py-1 rounded text-lg select-all mr-2">{resetPasswordModal.password}</span>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(resetPasswordModal.password);
                  toast.success('Password copied to clipboard!');
                }}
              >
                <ClipboardCopy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
            <Button type="button" onClick={() => setResetPasswordModal(null)} className="w-full mt-2" tooltip="Close dialog">
              Close
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  )
} 