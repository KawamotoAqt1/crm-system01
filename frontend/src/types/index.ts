// バックエンドAPIレスポンス型定義（統一版）

export interface Employee {
    id: string;
    employeeId: string;        // バックエンドに合わせて camelCase
    firstName: string;         // バックエンドに合わせて camelCase
    lastName: string;          // バックエンドに合わせて camelCase
    email: string;
    phone?: string;
    department: {
      id: string;
      name: string;
    };
    position: {
      id: string;
      name: string;
    };
    employmentType: 'REGULAR' | 'CONTRACT' | 'TEMPORARY' | 'PART_TIME'; // バックエンドに統一
    hireDate: string;          // バックエンドに合わせて camelCase
    createdAt: string;         // バックエンドに合わせて camelCase
    updatedAt: string;         // バックエンドに合わせて camelCase
  }
  
  export interface Department {
    id: string;
    name: string;
    description?: string;
    employeeCount?: number;    // API レスポンスに含まれる場合
  }
  
  export interface Position {
    id: string;
    name: string;
    level?: number;
    employeeCount?: number;    // API レスポンスに含まれる場合
  }
  
  export interface NewEmployeeForm {
    firstName: string;         // バックエンドに合わせて camelCase
    lastName: string;          // バックエンドに合わせて camelCase
    email: string;
    phone: string;
    departmentId: string;      // バックエンドに合わせて camelCase
    positionId: string;        // バックエンドに合わせて camelCase
    employmentType: 'REGULAR' | 'CONTRACT' | 'TEMPORARY' | 'PART_TIME';
    hireDate: string;          // バックエンドに合わせて camelCase
  }
  
  export interface UpdateEmployeeForm extends NewEmployeeForm {
    id: string;
  }
  
  // API data transfer types
  export type CreateEmployeeData = NewEmployeeForm;
  export type CreateDepartmentData = { name: string; description?: string; };
  export type CreatePositionData = { name: string; level?: number; };
  export type EmployeeSearchParams = EmployeeFilters;
  
  // API レスポンス型
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    timestamp: string;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    message?: string;
    timestamp: string;
  }
  
  // Alias for PaginatedResponse
  export type PaginationData<T> = PaginatedResponse<T>;
  
  export interface ApiError {
    error: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
    timestamp: string;
  }
  
  // 認証関連型
  export const UserRole = {
    ADMIN: 'ADMIN',
    HR_MANAGER: 'HR_MANAGER', 
    SALES_MANAGER: 'SALES_MANAGER',
    EMPLOYEE: 'EMPLOYEE'
  } as const;
  
  export type UserRole = typeof UserRole[keyof typeof UserRole];
  
  export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  // LoginCredentials supports both email and username for flexibility
  export interface LoginCredentials {
    username?: string;
    email: string;
    password: string;
  }
  
  export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
  }
  
  export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
  }
  
  // UI関連型
  export interface SidebarItem {
    key: string;
    label: string;
    path: string;
    icon?: React.ReactNode;
    requiredRole?: UserRole | UserRole[];
  }
  
  export interface SelectOption {
    value: string;
    label: string;
  }
  
  export interface SelectProps {
    name?: string;
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
  }
  
  // フィルタリング・検索用型
  export interface EmployeeFilters {
    search?: string;
    departmentId?: string;
    positionId?: string;
    employmentType?: Employee['employmentType'];
    page?: number;
    limit?: number;
  }
  
  // 雇用形態設定（バックエンドに統一）
  export const EMPLOYMENT_TYPE_CONFIG = {
    REGULAR: { label: '正社員', className: 'status-badge status-active' },
    CONTRACT: { label: '契約社員', className: 'status-badge status-pending' },
    TEMPORARY: { label: '派遣', className: 'status-badge status-warning' },
    PART_TIME: { label: 'アルバイト', className: 'status-badge status-pending' }
  } as const;
  
  // API エンドポイント定数
  export const API_ENDPOINTS = {
    // 認証
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      ME: '/api/auth/me'
    },
    // 社員管理
    EMPLOYEES: {
      LIST: '/api/employees',
      CREATE: '/api/employees',
      GET: (id: string) => `/api/employees/${id}`,
      UPDATE: (id: string) => `/api/employees/${id}`,
      DELETE: (id: string) => `/api/employees/${id}`
    },
    // 部署管理
    DEPARTMENTS: {
      LIST: '/api/departments',
      CREATE: '/api/departments',
      GET: (id: string) => `/api/departments/${id}`,
      UPDATE: (id: string) => `/api/departments/${id}`,
      DELETE: (id: string) => `/api/departments/${id}`
    },
    // 役職管理
    POSITIONS: {
      LIST: '/api/positions',
      CREATE: '/api/positions',
      GET: (id: string) => `/api/positions/${id}`,
      UPDATE: (id: string) => `/api/positions/${id}`,
      DELETE: (id: string) => `/api/positions/${id}`
    }
  } as const;