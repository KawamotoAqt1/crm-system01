import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { areaApi } from '../../services/areaApi';
import { Area } from '../../types';

interface AreaFormData {
  name: string;
  description: string;
}

interface AreaFormErrors {
  name?: string;
  description?: string;
  general?: string;
}

const AreaListPage: React.FC = () => {
  // ステート管理
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [formData, setFormData] = useState<AreaFormData>({
    name: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<AreaFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 削除関連
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingArea, setDeletingArea] = useState<Area | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 初期データ読み込み
  useEffect(() => {
    loadAreas();
  }, []);

  // エリア一覧取得
  const loadAreas = async () => {
    try {
      setLoading(true);
      const data = await areaApi.getAll();
      setAreas(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エリア一覧の取得に失敗しました');
      console.error('エリア取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング
  const filteredAreas = areas.filter(area =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // バリデーション
  const validateForm = () => {
    const errors: AreaFormErrors = {};
    if (!formData.name.trim()) {
      errors.name = 'エリア名は必須です';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (modalMode === 'create') {
        const newAreaResponse = await areaApi.create(formData);
        const newArea = (newAreaResponse as any)?.data || newAreaResponse;
        setAreas(prev => [...prev, newArea]);
        alert('エリアを正常に登録しました');
      } else {
        const updatedAreaResponse = await areaApi.update(editingArea!.id, formData);
        const updatedArea = (updatedAreaResponse as any)?.data || updatedAreaResponse;
        setAreas(prev => prev.map(area =>
          area.id === editingArea!.id ? updatedArea : area
        ));
        alert('エリア情報を正常に更新しました');
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('処理エラー:', error);
      const errorMessage = modalMode === 'create' ? 'エリア登録に失敗しました' : 'エリア情報の更新に失敗しました';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // モーダル操作
  const openCreateModal = () => {
    setModalMode('create');
    setEditingArea(null);
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (area: Area) => {
    setModalMode('edit');
    setEditingArea(area);
    setFormData({
      name: area.name,
      description: area.description || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openDeleteDialog = (area: Area) => {
    setDeletingArea(area);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingArea(null);
  };

  const handleDelete = async () => {
    if (!deletingArea) return;
    
    setIsDeleting(true);
    
    try {
      await areaApi.delete(deletingArea.id);
      setAreas(prev => prev.filter(area => area.id !== deletingArea.id));
      alert(`${deletingArea.name}を削除しました`);
      closeDeleteDialog();
      
    } catch (error: any) {
      console.error('削除エラー:', error);
      alert('エリアの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMode('create');
    setEditingArea(null);
    setFormData({ name: '', description: '' });
    setFormErrors({});
  };

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
      {/* ヘッダー - 他の管理画面と同じクラス名 */}
      <div className="content-header">
        <div>
          <h1 className="content-title">エリア管理</h1>
          <p className="content-subtitle">エリア情報の閲覧・編集・管理を行います</p>
        </div>
        <button className="add-btn" onClick={openCreateModal}>
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
              cursor: 'pointer',
              padding: '0 4px'
            }}
          >×</button>
        </div>
      )}
      
      {/* 検索・フィルタ - 他の管理画面と同じクラス名 */}
      <div className="search-filters">
        <input
          type="text"
          className="search-input"
          placeholder="エリア名で検索..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* テーブル - 他の管理画面と同じクラス名 */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>エリア</th>
              <th>説明</th>
              <th>所属社員数</th>
              <th>作成日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredAreas) && filteredAreas.length > 0 ? (
              filteredAreas.map(area => (
                <tr key={area.id}>
                  <td>
                    <div className="employee-info">
                      <div className="avatar">🗺️</div>
                      <div className="employee-details">
                        <div className="employee-name">{area.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{area.description || '-'}</td>
                  <td>
                    <span className="badge badge-blue">
                      {(area as any)._count?.employees || 0}名
                    </span>
                  </td>
                  <td>{new Date(area.createdAt).toLocaleDateString('ja-JP')}</td>
                  <td>
                    <div className="action-links">
                      <a 
                        href="#" 
                        className="action-link edit"
                        onClick={(e) => {
                          e.preventDefault();
                          openEditModal(area);
                        }}
                      >
                        編集
                      </a>
                      <a 
                        href="#" 
                        className="action-link delete"
                        onClick={(e) => {
                          e.preventDefault();
                          openDeleteDialog(area);
                        }}
                      >
                        削除
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  {searchTerm ? `"${searchTerm}" に一致するエリアが見つかりません` : 'エリアが登録されていません'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* エリア追加・編集モーダル */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? '新規エリア登録' : 'エリア編集'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>エリア名 <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例: 大阪、東京、福岡"
                    className={formErrors.name ? 'error' : ''}
                  />
                  {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label>説明</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="エリアの詳細説明（任意）"
                    rows={3}
                  />
                  {formErrors.description && <span className="error-text">{formErrors.description}</span>}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '処理中...' : (modalMode === 'create' ? '登録' : '更新')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {isDeleteDialogOpen && deletingArea && (
        <div className="modal-overlay" onClick={closeDeleteDialog}>
          <div className="modal-container small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>エリア削除確認</h2>
              <button className="modal-close" onClick={closeDeleteDialog}>×</button>
            </div>
            
            <div className="modal-body">
              <p>以下のエリアを削除しますか？</p>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                margin: '16px 0',
                border: '1px solid #e9ecef'
              }}>
                <strong>{deletingArea.name}</strong>
                {deletingArea.description && (
                  <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
                    {deletingArea.description}
                  </div>
                )}
              </div>
              <p style={{ color: '#dc3545', fontSize: '14px' }}>
                ⚠️ この操作は取り消せません。関連する社員データも影響を受ける可能性があります。
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeDeleteDialog}>
                キャンセル
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AreaListPage; 