// frontend/src/services/api.ts - 部署管理API統合版
import { 
    ApiResponse, 
    LoginCredentials,
    User,
    AuthTokens,
    Employee,
    CreateEmployeeData,
    Department,
    CreateDepartmentData,
    Position,
    CreatePositionData,
    EmployeeSearchParams
  } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // ローカルストレージからトークンを復元
    this.accessToken = localStorage.getItem('accessToken');
  }

  // トークン設定
  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }

  // トークン削除
  clearAccessToken() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // 基本リクエストメソッド
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // 認証エラーの場合、トークンをクリア
          this.clearAccessToken();
          throw new Error('認証が必要です');
        }
        
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('ネットワークエラーが発生しました');
    }
  }

  // 認証API
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.request<ApiResponse<{ user: User; tokens: AuthTokens }>>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data.tokens.accessToken) {
      this.setAccessToken(response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    }
    
    return response;
  }

  async logout(): Promise<ApiResponse<any>> {
    try {
      const response = await this.request<ApiResponse<any>>('/api/v1/auth/logout', { method: 'POST' });
      this.clearAccessToken();
      return response;
    } catch (error) {
      // ログアウトは失敗してもローカルのトークンはクリア
      this.clearAccessToken();
      throw error;
    }
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>('/api/v1/auth/me');
  }

  async refreshToken(): Promise<ApiResponse<{ tokens: AuthTokens }>> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('リフレッシュトークンがありません');
    }

    const response = await this.request<ApiResponse<{ tokens: AuthTokens }>>(
      '/api/v1/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken }) }
    );

    if (response.success && response.data.tokens.accessToken) {
      this.setAccessToken(response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    }

    return response;
  }

  // 社員API
  async getEmployees(params?: EmployeeSearchParams): Promise<ApiResponse<Employee[]> & { pagination?: any }> {
    const queryString = params ? 
      '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<ApiResponse<Employee[]> & { pagination?: any }>(`/api/v1/employees${queryString}`);
  }

  async getEmployee(id: string): Promise<ApiResponse<Employee>> {
    return this.request<ApiResponse<Employee>>(`/api/v1/employees/${id}`);
  }

  async createEmployee(data: CreateEmployeeData): Promise<ApiResponse<Employee>> {
    return this.request<ApiResponse<Employee>>('/api/v1/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: string, data: Partial<CreateEmployeeData>): Promise<ApiResponse<Employee>> {
    return this.request<ApiResponse<Employee>>(`/api/v1/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.request<ApiResponse<void>>(`/api/v1/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // 部署API
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    return this.request<ApiResponse<Department[]>>('/api/v1/departments');
  }

  async getDepartment(id: string): Promise<ApiResponse<Department>> {
    return this.request<ApiResponse<Department>>(`/api/v1/departments/${id}`);
  }

  async createDepartment(data: CreateDepartmentData): Promise<ApiResponse<Department>> {
    return this.request<ApiResponse<Department>>('/api/v1/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: string, data: Partial<CreateDepartmentData>): Promise<ApiResponse<Department>> {
    return this.request<ApiResponse<Department>>(`/api/v1/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: string): Promise<void> {
    await this.request<ApiResponse<void>>(`/api/v1/departments/${id}`, {
      method: 'DELETE',
    });
  }

  async getDepartmentStats(): Promise<any> {
    const response = await this.request<ApiResponse<any>>('/api/departments/stats/overview');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch department statistics');
    }
    return response.data;
  }

  // 役職API
  async getPositions(): Promise<ApiResponse<Position[]>> {
    return this.request<ApiResponse<Position[]>>('/api/v1/positions');
  }

  async getPosition(id: string): Promise<ApiResponse<Position>> {
    return this.request<ApiResponse<Position>>(`/api/v1/positions/${id}`);
  }

  async createPosition(data: CreatePositionData): Promise<ApiResponse<Position>> {
    return this.request<ApiResponse<Position>>('/api/v1/positions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePosition(id: string, data: Partial<CreatePositionData>): Promise<ApiResponse<Position>> {
    return this.request<ApiResponse<Position>>(`/api/v1/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePosition(id: string): Promise<void> {
    await this.request<ApiResponse<void>>(`/api/v1/positions/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== 検索・フィルタリング機能 ==========
  searchEmployees(employees: Employee[], query: string): Employee[] {
    if (!query.trim()) return employees;
    
    const searchTerm = query.toLowerCase().trim();
    return employees.filter(emp => 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm) ||
      emp.email.toLowerCase().includes(searchTerm) ||
      emp.department?.name.toLowerCase().includes(searchTerm) ||
      emp.position?.name.toLowerCase().includes(searchTerm)
    );
  }

  searchDepartments(departments: Department[], query: string): Department[] {
    if (!query.trim()) return departments;
    
    const searchTerm = query.toLowerCase().trim();
    return departments.filter(dept => 
      dept.name.toLowerCase().includes(searchTerm) ||
      (dept.description && dept.description.toLowerCase().includes(searchTerm))
    );
  }

  filterEmployees(
    employees: Employee[], 
    filters: {
      departmentId?: string;
      positionId?: string;
      employmentType?: string;
    }
  ): Employee[] {
    return employees.filter(emp => {
      if (filters.departmentId && emp.department?.id !== filters.departmentId) {
        return false;
      }
      if (filters.positionId && emp.position?.id !== filters.positionId) {
        return false;
      }
      if (filters.employmentType && emp.employmentType !== filters.employmentType) {
        return false;
      }
      return true;
    });
  }

  sortEmployees(
    employees: Employee[], 
    sortBy: string, 
    sortOrder: 'asc' | 'desc'
  ): Employee[] {
    return [...employees].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'department':
          comparison = (a.department?.name || '').localeCompare(b.department?.name || '');
          break;
        case 'position':
          comparison = (a.position?.name || '').localeCompare(b.position?.name || '');
          break;
        case 'hireDate':
          comparison = new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  sortDepartments(
    departments: Department[], 
    sortBy: 'name' | 'employeeCount' | 'createdAt', 
    sortOrder: 'asc' | 'desc'
  ): Department[] {
    return [...departments].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'employeeCount':
          comparison = (a.employeeCount || 0) - (b.employeeCount || 0);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }
}

// シングルトンインスタンス
export const api = new ApiService(API_BASE_URL);

// 別名エクスポート（既存コードとの互換性）
export const apiService = api;
export const employeeApi = api;
export const departmentApi = api;
export const positionApi = api;

// 個別のAPIサービス関数（オプション）
export const authAPI = {
  login: (credentials: LoginCredentials) => apiService.login(credentials),
  logout: () => apiService.logout(),
  getCurrentUser: () => apiService.getCurrentUser(),
  refreshToken: () => apiService.refreshToken(),
};

export const employeeAPI = {
  getAll: () => apiService.getEmployees(),
  getById: (id: string) => apiService.getEmployee(id),
  create: (data: CreateEmployeeData) => apiService.createEmployee(data),
  update: (id: string, data: Partial<CreateEmployeeData>) => apiService.updateEmployee(id, data),
  delete: (id: string) => apiService.deleteEmployee(id),
};

export const departmentAPI = {
  getAll: () => apiService.getDepartments(),
  getById: (id: string) => apiService.getDepartment(id),
  create: (data: CreateDepartmentData) => apiService.createDepartment(data),
  update: (id: string, data: Partial<CreateDepartmentData>) => apiService.updateDepartment(id, data),
  delete: (id: string) => apiService.deleteDepartment(id),
};

export const positionAPI = {
  getAll: () => apiService.getPositions(),
  getById: (id: string) => apiService.getPosition(id),
  create: (data: CreatePositionData) => apiService.createPosition(data),
  update: (id: string, data: Partial<CreatePositionData>) => apiService.updatePosition(id, data),
  delete: (id: string) => apiService.deletePosition(id),
};

export default apiService;