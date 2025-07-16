import { 
    ApiResponse, 
    ApiError, 
    PaginationData,
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
  
  // API設定
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
      const url = `${this.baseURL}/api/v1${endpoint}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
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
  
    // GET リクエスト
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
      const queryString = params ? 
        '?' + new URLSearchParams(params).toString() : '';
      
      return this.request<T>(`${endpoint}${queryString}`, {
        method: 'GET',
      });
    }
  
    // POST リクエスト
    async post<T>(endpoint: string, data?: any): Promise<T> {
      return this.request<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
    }
  
    // PUT リクエスト
    async put<T>(endpoint: string, data?: any): Promise<T> {
      return this.request<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
    }
  
    // DELETE リクエスト
    async delete<T>(endpoint: string): Promise<T> {
      return this.request<T>(endpoint, {
        method: 'DELETE',
      });
    }
  
    // 認証API
    async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
      const response = await this.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(
        '/auth/login', 
        credentials
      );
      
      if (response.success && response.data.tokens.accessToken) {
        this.setAccessToken(response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      }
      
      return response;
    }
  
    async logout(): Promise<ApiResponse<any>> {
      try {
        const response = await this.post<ApiResponse<any>>('/auth/logout');
        this.clearAccessToken();
        return response;
      } catch (error) {
        // ログアウトは失敗してもローカルのトークンはクリア
        this.clearAccessToken();
        throw error;
      }
    }
  
    async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
      return this.get<ApiResponse<{ user: User }>>('/auth/me');
    }
  
    async refreshToken(): Promise<ApiResponse<{ tokens: AuthTokens }>> {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('リフレッシュトークンがありません');
      }
  
      const response = await this.post<ApiResponse<{ tokens: AuthTokens }>>(
        '/auth/refresh',
        { refreshToken }
      );
  
      if (response.success && response.data.tokens.accessToken) {
        this.setAccessToken(response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      }
  
      return response;
    }
  
    // 社員API
    async getEmployees(params?: EmployeeSearchParams): Promise<ApiResponse<Employee[]> & { pagination?: any }> {
      return this.get<ApiResponse<Employee[]> & { pagination?: any }>('/employees', params);
    }
  
    async getEmployee(id: string): Promise<ApiResponse<Employee>> {
      return this.get<ApiResponse<Employee>>(`/employees/${id}`);
    }
  
    async createEmployee(data: CreateEmployeeData): Promise<ApiResponse<Employee>> {
      return this.post<ApiResponse<Employee>>('/employees', data);
    }
  
    async updateEmployee(id: string, data: Partial<CreateEmployeeData>): Promise<ApiResponse<Employee>> {
      return this.put<ApiResponse<Employee>>(`/employees/${id}`, data);
    }
  
    async deleteEmployee(id: string): Promise<void> {
      await this.delete(`/employees/${id}`);
    }
  
    // 部署API
    async getDepartments(): Promise<ApiResponse<Department[]>> {
      return this.get<ApiResponse<Department[]>>('/departments');
    }
  
    async getDepartment(id: string): Promise<ApiResponse<Department>> {
      return this.get<ApiResponse<Department>>(`/departments/${id}`);
    }
  
    async createDepartment(data: CreateDepartmentData): Promise<ApiResponse<Department>> {
      return this.post<ApiResponse<Department>>('/departments', data);
    }
  
    async updateDepartment(id: string, data: Partial<CreateDepartmentData>): Promise<ApiResponse<Department>> {
      return this.put<ApiResponse<Department>>(`/departments/${id}`, data);
    }
  
    async deleteDepartment(id: string): Promise<void> {
      await this.delete(`/departments/${id}`);
    }
  
    // 役職API
    async getPositions(): Promise<ApiResponse<Position[]>> {
      return this.get<ApiResponse<Position[]>>('/positions');
    }
  
    async getPosition(id: string): Promise<ApiResponse<Position>> {
      return this.get<ApiResponse<Position>>(`/positions/${id}`);
    }
  
    async createPosition(data: CreatePositionData): Promise<ApiResponse<Position>> {
      return this.post<ApiResponse<Position>>('/positions', data);
    }
  
    async updatePosition(id: string, data: Partial<CreatePositionData>): Promise<ApiResponse<Position>> {
      return this.put<ApiResponse<Position>>(`/positions/${id}`, data);
    }
  
    async deletePosition(id: string): Promise<void> {
      await this.delete(`/positions/${id}`);
    }
  }
  
  // シングルトンインスタンス
  export const apiService = new ApiService(API_BASE_URL);
  
  // 個別のAPIサービス関数（オプション）
  export const authAPI = {
    login: (credentials: LoginCredentials) => apiService.login(credentials),
    logout: () => apiService.logout(),
    getCurrentUser: () => apiService.getCurrentUser(),
    refreshToken: () => apiService.refreshToken(),
  };
  
  export const employeeAPI = {
    getAll: (params?: EmployeeSearchParams) => apiService.getEmployees(params),
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