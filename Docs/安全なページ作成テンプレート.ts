// 新しいページ作成用の安全なテンプレート
// 使用方法: このテンプレートをコピーして、必要な部分のみを変更する

import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout'; // 必須: 内部でLayout使用
import { apiService } from '../../services/api';
import { /* 必要な型をインポート */ } from '../../types';

const NewPage: React.FC = () => {
  // 基本的なstate（必要に応じて調整）
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');

  // データ取得（必要に応じて調整）
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API呼び出し
      const response = await apiService.getData(); // 実際のAPIメソッドに変更
      const dataArray = (response as any)?.data || response || [];
      
      setData(Array.isArray(dataArray) ? dataArray : []);
      setFilteredData(Array.isArray(dataArray) ? dataArray : []);
      
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました');
      
      // フォールバック用モックデータ（開発時のみ）
      const mockData = [
        { id: '1', name: 'サンプル1' },
        { id: '2', name: 'サンプル2' }
      ];
      setData(mockData);
      setFilteredData(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // フィルタリング処理
  useEffect(() => {
    if (!Array.isArray(data)) return;
    
    let filtered = [...data];
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedFilter) {
      filtered = filtered.filter(item => 
        item.category === selectedFilter
      );
    }
    
    setFilteredData(filtered);
  }, [data, searchTerm, selectedFilter]);

  // ローディング表示
  if (loading) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>データを読み込み中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ヘッダー - 必須: 既存のCSSクラスを使用 */}
      <div className="content-header">
        <div>
          <h1 className="content-title">新しいページ</h1>
          <p className="content-subtitle">新機能の説明をここに記載</p>
        </div>
        <button className="add-btn" onClick={() => console.log('新規作成')}>
          <span>+</span>
          <span>新規登録</span>
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >×</button>
        </div>
      )}
      
      {/* 検索・フィルタ - 必須: 既存のCSSクラスを使用 */}
      <div className="search-filters">
        <input
          type="text"
          className="search-input"
          placeholder="検索..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={selectedFilter}
          onChange={e => setSelectedFilter(e.target.value)}
        >
          <option value="">すべて</option>
          <option value="option1">オプション1</option>
          <option value="option2">オプション2</option>
        </select>
      </div>
      
      {/* テーブル - 必須: 既存のCSSクラスを使用 */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>項目</th>
              <th>説明</th>
              <th>作成日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredData) && filteredData.length > 0 ? (
              filteredData.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="employee-info">
                      <div className="avatar">📋</div>
                      <div className="employee-details">
                        <div className="employee-name">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.description || '-'}</td>
                  <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('ja-JP') : '-'}</td>
                  <td>
                    <div className="action-links">
                      <a href="#" className="action-link edit" 
                         onClick={e => { e.preventDefault(); console.log('編集:', item.id); }}>
                        編集
                      </a>
                      <a href="#" className="action-link delete" 
                         onClick={e => { e.preventDefault(); console.log('削除:', item.id); }}>
                        削除
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px',
                  color: '#6b7280',
                  fontSize: '14px' 
                }}>
                  データがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* ページネーション */}
        <div className="pagination">
          <div className="pagination-info">
            1 から {filteredData.length} まで表示（全 {data.length} 件中）
          </div>
          <div className="pagination-controls">
            <button className="page-btn" disabled>前へ</button>
            <button className="page-btn active">1</button>
            <button className="page-btn" disabled>次へ</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewPage;