// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
  }
  
  export interface ApiError {
    success: false;
    error: {
      code: string;
      message: string;
      details?: any;
    };
  }
  
  export interface PaginationData<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  
  // User & Auth Types
  export const UserRole = {
    ADMIN: 'ADMIN',
    HR_MANAGER: 'HR_MANAGER',
    SALES_MANAGER: 'SALES_MANAGER',
    EMPLOYEE: 'EMPLOYEE'
  } as const;
  
  export type UserRole = typeof UserRole[keyof typeof UserRole];
  
  export interface User {
    id: string;
    username: string;
    role: UserRole;
    lastLoginAt?: string;
    employee: Employee;
  }
  
  export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
  }
  
  export interface LoginCredentials {
    username: string;
    password: string;
  }
  
  // Employee Types
  export const EmploymentType = {
    REGULAR: 'REGULAR',
    CONTRACT: 'CONTRACT',
    TEMPORARY: 'TEMPORARY',
    PART_TIME: 'PART_TIME'
  } as const;
  
  export type EmploymentType = typeof EmploymentType[keyof typeof EmploymentType];
  
  export interface Employee {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    firstNameKana?: string;
    lastNameKana?: string;
    email: string;
    phone?: string;
    departmentId: string;
    positionId: string;
    hireDate: string;
    employmentType: EmploymentType;
    birthDate?: string;
    address?: string;
    emergencyContact?: string;
    education?: string;
    workHistory?: string;
    skills?: string;
    photoUrl?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    
    // Relations
    department: Department;
    position: Position;
  }
  
  export interface CreateEmployeeData {
    employeeId: string;
    firstName: string;
    lastName: string;
    firstNameKana?: string;
    lastNameKana?: string;
    email: string;
    phone?: string;
    departmentId: string;
    positionId: string;
    hireDate: string;
    employmentType: EmploymentType;
    birthDate?: string;
    address?: string;
    emergencyContact?: string;
    education?: string;
    workHistory?: string;
    skills?: string;
    notes?: string;
  }
  
  // Department Types
  export interface Department {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    employeeCount?: number;
  }
  
  export interface CreateDepartmentData {
    name: string;
    description?: string;
  }
  
  // Position Types
  export interface Position {
    id: string;
    name: string;
    level: number;
    description?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    employeeCount?: number;
  }
  
  export interface CreatePositionData {
    name: string;
    level: number;
    description?: string;
  }
  
  // Search & Filter Types
  export interface EmployeeSearchParams {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    positionId?: string;
    employmentType?: EmploymentType;
    sortBy?: 'firstName' | 'lastName' | 'hireDate' | 'employeeId';
    sortOrder?: 'asc' | 'desc';
  }
  
  // Form Types
  export interface FormError {
    field: string;
    message: string;
  }
  
  export interface FormState<T> {
    data: T;
    errors: FormError[];
    isSubmitting: boolean;
    isValid: boolean;
  }
  
  // UI Component Types
  export interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    className?: string;
  }
  
  export interface InputProps {
    name: string;
    label?: string;
    type?: 'text' | 'email' | 'password' | 'tel' | 'date' | 'textarea';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    className?: string;
  }
  
  export interface SelectOption {
    value: string;
    label: string;
  }
  
  export interface SelectProps {
    name: string;
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    className?: string;
  }
  
  // Table Types
  export interface TableColumn<T> {
    key: keyof T | string;
    header: string;
    render?: (value: any, item: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
  }
  
  export interface TableProps<T> {
    data: T[];
    columns: TableColumn<T>[];
    onSort?: (column: keyof T | string, direction: 'asc' | 'desc') => void;
    onRowClick?: (item: T) => void;
    loading?: boolean;
    emptyMessage?: string;
  }
  
  // Modal Types
  export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closable?: boolean;
  }
  
  // Layout Types
  export interface SidebarItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
    path: string;
    children?: SidebarItem[];
    requiredRole?: UserRole[];
  }
  
  // Hook Types
  export interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
  }
  
  export interface UseFormState<T> {
    values: T;
    errors: Record<keyof T, string>;
    touched: Record<keyof T, boolean>;
    isSubmitting: boolean;
    isValid: boolean;
    setValue: (field: keyof T, value: any) => void;
    setError: (field: keyof T, error: string) => void;
    reset: () => void;
    handleSubmit: (onSubmit: (values: T) => Promise<void>) => (e: React.FormEvent) => void;
  }