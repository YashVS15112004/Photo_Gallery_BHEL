import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Filter, Download, Calendar, User, Activity } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { formatDate } from '../lib/utils'
import api from '../lib/api'
import { ActivityLog } from '../types'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx';

export function ActivityLogs() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    user: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  })
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.user) params.append('user', filters.user);
      if (filters.action) params.append('action', filters.action);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      const response = await api.get(`/admin/logs?${params.toString()}`);
      return response.data.logs;
    },
  })

  // Calculate paginated logs
  const paginatedLogs = logs ? logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];
  const totalPages = logs ? Math.ceil(logs.length / itemsPerPage) : 1;

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800'
      case 'update':
        return 'bg-blue-100 text-blue-800'
      case 'delete':
        return 'bg-red-100 text-red-800'
      case 'login':
        return 'bg-purple-100 text-purple-800'
      case 'logout':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePendingFilterChange = (key: string, value: string) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setFilters({
      ...pendingFilters,
      search: searchInput
    });
  };

  const handleExport = () => {
    if (!logs || logs.length === 0) {
      toast.error('No logs to export');
      return;
    }
    // Prepare data for Excel
    const exportData = logs.map((log: ActivityLog) => ({
      Timestamp: formatDate(log.timestamp),
      User: log.user?.username || log.user || '',
      Action: log.action,
      Resource: log.resource,
      Details: log.details,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Logs');
    XLSX.writeFile(workbook, 'activity_logs.xlsx');
    toast.success('Logs exported as Excel file');
  }

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all activity logs? This action cannot be undone.')) return;
    try {
      await api.delete('/admin/logs');
      toast.success('All activity logs cleared');
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to clear logs');
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">Monitor system activity and user actions</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
          <Button variant="danger" onClick={handleClearLogs}>
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Search logs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
            {/* User/Admin filter */}
            <select
              className="input"
              value={pendingFilters.user}
              onChange={(e) => handlePendingFilterChange('user', e.target.value)}
            >
              <option value="">All</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className="input"
              value={pendingFilters.action}
              onChange={(e) => handlePendingFilterChange('action', e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="toggle_visibility">Toggle Visibility</option>
              <option value="delete_album">Delete Album</option>
              <option value="upload_image">Upload Image</option>
              <option value="delete_image">Delete Image</option>
              <option value="modify_caption">Modify Caption</option>
              <option value="modify_thumbnail">Modify Thumbnail</option>
            </select>
            <Input
              type="date"
              value={pendingFilters.dateFrom}
              onChange={(e) => handlePendingFilterChange('dateFrom', e.target.value)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <Button onClick={handleSearch} className="w-full">Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLogs.map((log: ActivityLog) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {log.user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {log.user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.resource}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!logs || logs.length === 0) && (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activity logs</h3>
              <p className="mt-1 text-sm text-gray-500">
                No activity logs found for the selected filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
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