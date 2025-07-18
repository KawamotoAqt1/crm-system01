import { Area } from '../types';

const API_BASE_URL = 'http://localhost:3001/api/v1';

export const areaApi = {
  // エリア一覧取得
  async getAll(): Promise<Area[]> {
    const response = await fetch(`${API_BASE_URL}/areas`);
    if (!response.ok) {
      throw new Error('エリア一覧の取得に失敗しました');
    }
    const result = await response.json();
    return result.data || result;
  },

  // エリア詳細取得
  async getById(id: string): Promise<Area> {
    const response = await fetch(`${API_BASE_URL}/areas/${id}`);
    if (!response.ok) {
      throw new Error('エリア詳細の取得に失敗しました');
    }
    return response.json();
  },

  // エリア作成
  async create(area: Omit<Area, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Area> {
    const response = await fetch(`${API_BASE_URL}/areas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(area),
    });
    if (!response.ok) {
      throw new Error('エリアの作成に失敗しました');
    }
    return response.json();
  },

  // エリア更新
  async update(id: string, area: Partial<Omit<Area, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<Area> {
    const response = await fetch(`${API_BASE_URL}/areas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(area),
    });
    if (!response.ok) {
      throw new Error('エリアの更新に失敗しました');
    }
    return response.json();
  },

  // エリア削除
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/areas/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'エリアの削除に失敗しました');
    }
  },
}; 