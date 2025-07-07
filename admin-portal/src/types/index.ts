export interface User {
  _id: string
  username: string
  email: string
  role: 'user' | 'admin'
  isAuthorized: boolean
  createdAt: string
  lastLogin?: string
}

export interface Album {
  _id: string
  name: string
  description?: string
  isHidden: boolean
  createdBy: User
  thumbnail?: Image
  images: Image[]
  createdAt: string
  updatedAt: string
}

export interface Image {
  _id: string
  originalName: string
  filename: string
  path: string
  size: number
  mimetype: string
  uploadedBy: User
  uploadedAt: string
}

export interface SystemStats {
  userCount: number
  albumCount: number
  imageCount: number
  authorizedUserCount: number
  hiddenAlbumCount: number
}

export interface RecentActivity {
  users: User[]
  albums: Album[]
  images: Image[]
}

export interface ActivityLog {
  _id: string
  user: User
  action: string
  resource: string
  resourceId: string
  details: string
  timestamp: string
  ipAddress: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  role: 'user' | 'admin'
}

export interface UpdateUserData {
  username?: string
  email?: string
  role?: 'user' | 'admin'
  isAuthorized?: boolean
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
} 