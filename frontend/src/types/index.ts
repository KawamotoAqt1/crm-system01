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
  
  export interface CreateEmployeeData {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    departmentId: string;
    positionId: string;
    employmentType: 'REGULAR' | 'CONTRACT' | 'TEMPORARY' | 'PART_TIME';
    hireDate: string;
  }
  
  export interface NewEmployeeForm {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    departmentId: string;
    positionId: string;
    employmentType: 'REGULAR' | 'CONTRACT' | 'TEMPORARY' | 'PART_TIME';
    hireDate: string;
  }
  
  export type EmploymentType = 'REGULAR' | 'CONTRACT' | 'TEMPORARY' | 'PART_TIME';
  
  // EmploymentType設定
  export const EMPLOYMENT_TYPE_CONFIG = {
    REGULAR: { label: '正社員', className: 'badge badge-blue' },
    CONTRACT: { label: '契約社員', className: 'badge badge-green' },
    TEMPORARY: { label: '派遣', className: 'badge badge-yellow' },
    PART_TIME: { label: 'アルバイト', className: 'badge badge-gray' }
  } as const;
  
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
  }
  
  export interface ApiError {
    code: string;
    message: string;
    details?: any;
  }
  
  export interface PaginationData<T> {
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

// 部署管理型定義
export interface Department {
  id: string;
  name: string;
  description?: string | null;
  employeeCount?: number;
  employees?: Employee[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentData {
  name: string;
  description?: string;
}

export interface DepartmentCreateRequest {
  name: string;
  description?: string;
}

export interface DepartmentUpdateRequest {
  name: string;
  description?: string;
}

export interface DepartmentStats {
  totalDepartments: number;
  totalEmployees: number;
  departmentStats: {
    id: string;
    name: string;
    employeeCount: number;
  }[];
}

export interface DepartmentDeleteConflict {
  employeeCount: number;
  employees: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
}

// 役職型定義
export interface Position {
  id: string;
  name: string;
  level?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePositionData {
  name: string;
  level?: number;
  description?: string;
}

// 認証関連型定義
export const UserRole = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER', 
  SALES_MANAGER: 'SALES_MANAGER',
  EMPLOYEE: 'EMPLOYEE'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: string;
  employeeId: string;
  username: string;
  role: UserRoleType;
  isActive: boolean;
  employee?: Employee;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  email?: string;
  password: string;
}

// UI コンポーネント型定義
export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  name?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

// データ転送用型定義
export interface EmployeeSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  positionId?: string;
  employmentType?: EmploymentType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API レスポンス型
export interface DepartmentResponse {
  success: boolean;
  data?: Department | Department[] | DepartmentStats;
  message: string;
  error?: string;
}

export interface DepartmentDeleteResponse {
  success: boolean;
  message: string;
  data?: DepartmentDeleteConflict;
}

// フォーム型定義
export interface DepartmentFormData {
  name: string;
  description: string;
}

export interface DepartmentFormErrors {
  name?: string;
  description?: string;
  general?: string;
}

// テーブル表示用型定義
export interface DepartmentTableItem extends Department {
  actions?: {
    canEdit: boolean;
    canDelete: boolean;
    hasEmployees: boolean;
  };
}

// 検索・フィルタ用型定義
export interface DepartmentFilters {
  search: string;
  sortBy: 'name' | 'employeeCount' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  minEmployees?: number;
  maxEmployees?: number;
}

// ページネーション型定義
export interface DepartmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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