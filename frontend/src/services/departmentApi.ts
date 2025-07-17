// frontend/src/services/departmentApi.ts
import { 
    Department, 
    DepartmentCreateRequest, 
    DepartmentUpdateRequest,
    DepartmentResponse,
    DepartmentDeleteResponse,
    DepartmentStats 
  } from '../types';
  
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  class DepartmentApiService {
    private async request<T>(
      endpoint: string, 
      options: RequestInit = {}
    ): Promise<T> {
      const token = localStorage.getItem('authToken');
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };
  
      try {
        const response = await fetch(`${API_BASE_URL}/api/departments${endpoint}`, config);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Department API request failed:', error);
        throw error;
      }
    }
  
    // 部署一覧取得
    async getDepartments(): Promise<Department[]> {
      const response = await this.request<DepartmentResponse>('');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch departments');
      }
      return Array.isArray(response.data) ? response.data : [];
    }
  
    // 特定部署取得
    async getDepartment(id: string): Promise<Department> {
      const response = await this.request<DepartmentResponse>(`/${id}`);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch department');
      }
      return response.data as Department;
    }
  
    // 部署作成
    async createDepartment(data: DepartmentCreateRequest): Promise<Department> {
      const response = await this.request<DepartmentResponse>('', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create department');
      }
      return response.data as Department;
    }
  
    // 部署更新
    async updateDepartment(id: string, data: DepartmentUpdateRequest): Promise<Department> {
      const response = await this.request<DepartmentResponse>(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update department');
      }
      return response.data as Department;
    }
  
    // 部署削除
    async deleteDepartment(id: string, force: boolean = false): Promise<void> {
      const endpoint = force ? `/${id}?force=true` : `/${id}`;
      const response = await this.request<DepartmentDeleteResponse>(endpoint, {
        method: 'DELETE',
      });
      
      if (!response.success) {
        if (response.data) {
          // 関連社員存在エラーの場合、詳細データを含めてエラーを投げる
          const error = new Error(response.message) as any;
          error.conflictData = response.data;
          throw error;
        }
        throw new Error(response.message || 'Failed to delete department');
      }
    }
  
    // 部署統計取得
    async getDepartmentStats(): Promise<DepartmentStats> {
      const response = await this.request<DepartmentResponse>('/stats/overview');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch department statistics');
      }
      return response.data as DepartmentStats;
    }
  
    // 部署検索（フロントエンド側で実装）
    searchDepartments(departments: Department[], query: string): Department[] {
      if (!query.trim()) return departments;
      
      const searchTerm = query.toLowerCase().trim();
      return departments.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm) ||
        (dept.description && dept.description.toLowerCase().includes(searchTerm))
      );
    }
  
    // 部署ソート
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
  
    // フィルタリング
    filterDepartments(
      departments: Department[], 
      filters: {
        minEmployees?: number;
        maxEmployees?: number;
        sortBy?: 'name' | 'employeeCount' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      }
    ): Department[] {
      const { minEmployees, maxEmployees } = filters;
      const filtered = departments.filter(dept => {
        if (minEmployees !== undefined && (dept.employeeCount || 0) < minEmployees) {
          return false;
        }
        if (maxEmployees !== undefined && (dept.employeeCount || 0) > maxEmployees) {
          return false;
        }
        return true;
      });

      return this.sortDepartments(
        filtered.filter(dept => 
          (dept.employeeCount || 0) >= (minEmployees || 0) && 
          (dept.employeeCount || 0) <= (maxEmployees || Infinity)
        ),
        filters.sortBy || 'name',
        filters.sortOrder || 'asc'
      );
    }
  }
  
  export const departmentApi = new DepartmentApiService();