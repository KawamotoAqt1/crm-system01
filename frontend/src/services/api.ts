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
  CreatePositionRequest,
  UpdatePositionRequest,
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
        // 開発環境でコンソールエラーを抑制
        const isDev = import.meta.env.DEV;
        if (!isDev) {
          console.warn('認証が必要です');
        }
        throw new Error('認証が必要です');
      }
      
      const errorData = await response.json().catch(() => null);
      console.error('API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url,
        errorData
      });
      
      // バリデーションエラーの詳細を表示
      if (errorData?.error?.details) {
        const validationErrors = errorData.error.details.map((detail: any) => detail.message).join(', ');
        throw new Error(`バリデーションエラー: ${validationErrors}`);
      }
      
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
  // アクセストークンがない場合は早期にエラーを返す
  if (!this.accessToken) {
    throw new Error('認証が必要です');
  }
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
  const url = `${this.baseURL}/api/v1/employees/${id}`;
  
  const headers: Record<string, string> = {};
  if (this.accessToken) {
    headers.Authorization = `Bearer ${this.accessToken}`;
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      this.clearAccessToken();
      throw new Error('認証が必要です');
    }
    
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error?.message || `削除に失敗しました (${response.status})`);
  }

  // 204 No Contentの場合は何もしない（成功）
  if (response.status === 204) {
    return;
  }

  // その他の場合はJSONレスポンスを処理
  await response.json();
}

// 社員データCSVエクスポート
async exportEmployeesCSV(params?: EmployeeSearchParams): Promise<void> {
  try {
    const queryString = params ? 
      '?' + new URLSearchParams(params as any).toString() : '';
    
    const url = `${this.baseURL}/api/v1/employees/export/csv${queryString}`;
    
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAccessToken();
        throw new Error('認証が必要です');
      }
      throw new Error('CSVエクスポートに失敗しました');
    }

    // レスポンスからファイル名取得
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'employees.csv';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Blobとしてダウンロード
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // 仮想リンクでダウンロード実行
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // メモリクリーンアップ
    window.URL.revokeObjectURL(downloadUrl);
    
  } catch (error) {
    console.error('CSV エクスポートエラー:', error);
    throw error;
  }
}

// 写真アップロード
async uploadPhoto(file: File): Promise<{ success: boolean; data: { photoUrl: string; filename: string; originalName: string; size: number; mimeType: string } }> {
  try {
    const formData = new FormData();
    formData.append('photo', file);

    const url = `${this.baseURL}/api/v1/employees/upload-photo`;
    
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAccessToken();
        throw new Error('認証が必要です');
      }
      
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || '写真アップロードに失敗しました');
    }

    return await response.json();
  } catch (error) {
    console.error('写真アップロードエラー:', error);
    throw error;
  }
}

// 写真ファイル削除
async deletePhoto(filename: string): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${this.baseURL}/api/v1/employees/photo/${filename}`;
    
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAccessToken();
        throw new Error('認証が必要です');
      }
      
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || '写真削除に失敗しました');
    }

    return await response.json();
  } catch (error) {
    console.error('写真削除エラー:', error);
    throw error;
  }
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
  const url = `${this.baseURL}/api/v1/departments/${id}`;
  
  const headers: Record<string, string> = {};
  if (this.accessToken) {
    headers.Authorization = `Bearer ${this.accessToken}`;
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      this.clearAccessToken();
      throw new Error('認証が必要です');
    }
    
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error?.message || `削除に失敗しました (${response.status})`);
  }

  // 204 No Contentの場合は何もしない（成功）
  if (response.status === 204) {
    return;
  }

  // その他の場合はJSONレスポンスを処理
  await response.json();
}

async getDepartmentStats(): Promise<any> {
  const response = await this.request<ApiResponse<any>>('/api/departments/stats/overview');
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to fetch department statistics');
  }
  return response.data;
}

// ========================================
// 役職API（完全版・employees.ts形式統一）
// ========================================

// 役職一覧取得
async getPositions(): Promise<Position[]> {
  try {
    const response = await this.request<{ success: true; data: Position[] }>('/api/v1/positions');
    // バックエンドレスポンス形式: { success: true, data: [...] } (employees.tsと統一)
    if (response?.success && response?.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    return [];
  } catch (error) {
    console.error('役職一覧取得エラー:', error);
    return [];
  }
}

// 個別役職取得
async getPosition(id: string): Promise<Position | null> {
  try {
    const response = await this.request<{ success: true; data: Position }>(`/api/v1/positions/${id}`);
    if (response?.success && response?.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('役職取得エラー:', error);
    return null;
  }
}

// 役職作成
async createPosition(data: CreatePositionRequest): Promise<Position> {
  try {
    const response = await this.request<{ success: true; data: Position; message?: string }>('/api/v1/positions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (response?.success && response?.data) {
      return response.data;
    }
    
    throw new Error('役職作成に失敗しました');
  } catch (error) {
    console.error('役職作成エラー:', error);
    throw error;
  }
}

// 役職更新
async updatePosition(id: string, data: UpdatePositionRequest): Promise<Position> {
  try {
    const response = await this.request<{ success: true; data: Position; message?: string }>(`/api/v1/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    if (response?.success && response?.data) {
      return response.data;
    }
    
    throw new Error('役職更新に失敗しました');
  } catch (error) {
    console.error('役職更新エラー:', error);
    throw error;
  }
}

// 役職削除
async deletePosition(id: string): Promise<void> {
  const url = `${this.baseURL}/api/v1/positions/${id}`;
  
  const headers: Record<string, string> = {};
  if (this.accessToken) {
    headers.Authorization = `Bearer ${this.accessToken}`;
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      this.clearAccessToken();
      throw new Error('認証が必要です');
    }
    
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error?.message || `削除に失敗しました (${response.status})`);
  }

  // 204 No Contentの場合は何もしない（成功）
  if (response.status === 204) {
    return;
  }

  // その他の場合はJSONレスポンスを処理
  await response.json();
}

// 役職統計情報取得（将来拡張用）
async getPositionStats(): Promise<any> {
  try {
    const response = await this.request<ApiResponse<any>>('/api/v1/positions/stats/overview');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch position statistics');
    }
    return response.data;
  } catch (error) {
    console.error('役職統計取得エラー:', error);
    throw error;
  }
}

// ========================================
// 検索・フィルタリング機能（役職対応版）
// ========================================

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

// 役職検索機能（新規追加）
searchPositions(positions: Position[], query: string): Position[] {
  if (!query.trim()) return positions;
  
  const searchTerm = query.toLowerCase().trim();
  return positions.filter(pos => 
    pos.name.toLowerCase().includes(searchTerm) ||
    (pos.description && pos.description.toLowerCase().includes(searchTerm)) ||
    pos.level.toString().includes(searchTerm)
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

// 役職フィルタリング機能（新規追加）
filterPositions(
  positions: Position[], 
  filters: {
    minLevel?: number;
    maxLevel?: number;
    hasDescription?: boolean;
  }
): Position[] {
  return positions.filter(pos => {
    if (filters.minLevel && pos.level < filters.minLevel) {
      return false;
    }
    if (filters.maxLevel && pos.level > filters.maxLevel) {
      return false;
    }
    if (filters.hasDescription !== undefined) {
      const hasDesc = pos.description && pos.description.trim().length > 0;
      if (filters.hasDescription && !hasDesc) {
        return false;
      }
      if (!filters.hasDescription && hasDesc) {
        return false;
      }
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

// 役職ソート機能（新規追加）
sortPositions(
  positions: Position[], 
  sortBy: 'name' | 'level' | 'createdAt', 
  sortOrder: 'asc' | 'desc'
): Position[] {
  return [...positions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'level':
        comparison = a.level - b.level;
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

// ========================================
// ユーティリティ関数（新規追加）
// ========================================

// 役職レベル別グループ化
groupPositionsByLevel(positions: Position[]): { [level: number]: Position[] } {
  return positions.reduce((groups, position) => {
    const level = position.level;
    if (!groups[level]) {
      groups[level] = [];
    }
    groups[level].push(position);
    return groups;
  }, {} as { [level: number]: Position[] });
}

// 役職階層取得
getPositionHierarchy(positions: Position[]): Position[] {
  return positions.sort((a, b) => b.level - a.level);
}

// 役職レベル検証
validatePositionLevel(level: number): boolean {
  return level >= 1 && level <= 10 && Number.isInteger(level);
}

// 役職名重複チェック
checkPositionNameDuplicate(positions: Position[], name: string, excludeId?: string): boolean {
  return positions.some(pos => 
    pos.name.toLowerCase() === name.toLowerCase() && 
    pos.id !== excludeId
  );
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
exportCSV: (params?: EmployeeSearchParams) => apiService.exportEmployeesCSV(params),
};

export const departmentAPI = {
getAll: () => apiService.getDepartments(),
getById: (id: string) => apiService.getDepartment(id),
create: (data: CreateDepartmentData) => apiService.createDepartment(data),
update: (id: string, data: Partial<CreateDepartmentData>) => apiService.updateDepartment(id, data),
delete: (id: string) => apiService.deleteDepartment(id),
};

// 役職API（新規追加）
export const positionAPI = {
getAll: () => apiService.getPositions(),
getById: (id: string) => apiService.getPosition(id),
create: (data: CreatePositionRequest) => apiService.createPosition(data),
update: (id: string, data: UpdatePositionRequest) => apiService.updatePosition(id, data),
delete: (id: string) => apiService.deletePosition(id),
getStats: () => apiService.getPositionStats(),
search: (positions: Position[], query: string) => apiService.searchPositions(positions, query),
filter: (positions: Position[], filters: any) => apiService.filterPositions(positions, filters),
sort: (positions: Position[], sortBy: any, sortOrder: 'asc' | 'desc') => apiService.sortPositions(positions, sortBy, sortOrder),
};

export default apiService;