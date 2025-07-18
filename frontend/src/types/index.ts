// バックエンドAPIレスポンス型定義（統一版）

export interface Employee {
  id: string;
  employeeId: string;        // バックエンドに合わせて camelCase
  firstName: string;         // バックエンドに合わせて camelCase
  lastName: string;          // バックエンドに合わせて camelCase
  firstNameKana?: string;    // 名前（カナ）
  lastNameKana?: string;     // 姓（カナ）
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
  birthDate?: string;        // 生年月日
  address?: string;          // 住所
  emergencyContact?: string; // 緊急連絡先
  education?: string;        // 学歴
  workHistory?: string;      // 職歴
  skills?: string;           // スキル
  photoUrl?: string;         // 写真URL
  notes?: string;            // 備考
  createdAt: string;         // バックエンドに合わせて camelCase
  updatedAt: string;         // バックエンドに合わせて camelCase
}

export interface CreateEmployeeData {
  employeeId?: string; // 新規登録時は自動生成されるためオプショナル
  firstName: string;
  lastName: string;
  firstNameKana?: string;
  lastNameKana?: string;
  email: string;
  phone?: string;
  departmentId: string;
  positionId: string;
  employmentType: 'REGULAR' | 'CONTRACT' | 'TEMPORARY' | 'PART_TIME';
  hireDate: string;
  birthDate?: string;
  address?: string;
  emergencyContact?: string;
  education?: string;
  workHistory?: string;
  skills?: string;
  photoUrl?: string;
  notes?: string;
}

export interface NewEmployeeForm {
  employeeId: string; // フォーム上では文字列として扱う（空文字可）
  firstName: string;
  lastName: string;
  firstNameKana: string;
  lastNameKana: string;
  email: string;
  phone: string;
  departmentId: string;
  positionId: string;
  employmentType: 'REGULAR' | 'CONTRACT' | 'TEMPORARY' | 'PART_TIME';
  hireDate: string;
  birthDate: string;
  address: string;
  emergencyContact: string;
  education: string;
  workHistory: string;
  skills: string;
  photoUrl: string;
  notes: string;
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

// ========================================
// 役職管理型定義（新規追加・完全版）
// ========================================

// 役職基本情報型
export interface Position {
id: string;
name: string;
level: number;
description?: string | null;
createdAt: string;
updatedAt: string;
deletedAt?: string | null;
}

// 役職作成リクエスト型
export interface CreatePositionRequest {
name: string;
level: number;
description?: string;
}

// 役職更新リクエスト型
export interface UpdatePositionRequest {
name?: string;
level?: number;
description?: string;
}

// 役職作成データ型（旧互換性維持）
export interface CreatePositionData {
name: string;
level?: number;
description?: string;
}

// API レスポンス型定義
export interface PositionListResponse {
success: true;
data: Position[];
}

export interface PositionResponse {
success: true;
data: Position;
message?: string;
}

// フォームデータ型定義
export interface PositionFormData {
name: string;
level: number;
description: string;
}

// フォームエラー型定義
export interface PositionFormErrors {
name?: string;
level?: string;
description?: string;
general?: string;
}

// 役職統計情報型
export interface PositionStats {
totalPositions: number;
totalEmployees: number;
positionStats: {
  id: string;
  name: string;
  level: number;
  employeeCount: number;
}[];
}

// 役職削除時の競合情報型
export interface PositionDeleteConflict {
employeeCount: number;
employees: {
  id: string;
  firstName: string;
  lastName: string;
  department: {
    id: string;
    name: string;
  };
}[];
}

// テーブル表示用型定義
export interface PositionTableItem extends Position {
employeeCount?: number;
actions?: {
  canEdit: boolean;
  canDelete: boolean;
  hasEmployees: boolean;
};
}

// 検索・フィルタ用型定義
export interface PositionFilters {
search: string;
sortBy: 'name' | 'level' | 'employeeCount' | 'createdAt';
sortOrder: 'asc' | 'desc';
minLevel?: number;
maxLevel?: number;
}

// ページネーション型定義
export interface PositionPagination {
page: number;
limit: number;
total: number;
totalPages: number;
}

// 役職レベル設定
export const POSITION_LEVEL_CONFIG = {
1: { label: 'レベル1', color: '#6b7280', category: '一般職' },
2: { label: 'レベル2', color: '#6b7280', category: '一般職' },
3: { label: 'レベル3', color: '#6b7280', category: '一般職' },
4: { label: 'レベル4', color: '#2563eb', category: 'シニア職' },
5: { label: 'レベル5', color: '#2563eb', category: 'シニア職' },
6: { label: 'レベル6', color: '#2563eb', category: '主任級' },
7: { label: 'レベル7', color: '#d97706', category: '管理職' },
8: { label: 'レベル8', color: '#d97706', category: '管理職' },
9: { label: 'レベル9', color: '#d97706', category: '役員級' },
10: { label: 'レベル10', color: '#d97706', category: '役員級' }
} as const;

// ========================================
// 既存の型定義（変更なし）
// ========================================

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

// 役職API レスポンス型（新規追加）
export interface PositionApiResponse {
success: boolean;
data?: Position | Position[] | PositionStats;
message: string;
error?: string;
}

export interface PositionDeleteResponse {
success: boolean;
message: string;
data?: PositionDeleteConflict;
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