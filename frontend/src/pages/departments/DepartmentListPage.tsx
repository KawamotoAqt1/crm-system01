// frontend/src/pages/departments/DepartmentListPage.tsx - 社員管理と完全同一構造
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout'; // 社員管理と同じように内部でLayout使用
import { apiService } from '../../services/api';
import { Department, CreateDepartmentData } from '../../types';

const DepartmentListPage: React.FC = () => {
  // State管理
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState('name');
  
  // モーダル状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<CreateDepartmentData>({
    name: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 削除確認ダイアログ状態
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // データ取得
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getDepartments();
      const data = (response as any)?.data || response || [];
      
      setDepartments(Array.isArray(data) ? data : []);
      setFilteredDepartments(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error('部署データ取得エラー:', err);
      setError('データの取得に失敗しました');
      
      // フォールバック用モックデータ
      const fallbackData: Department[] = [
        {
          id: '1',
          name: '営業部',
          description: '営業活動・顧客対応を担当',
          employeeCount: 3,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          name: '開発部',
          description: 'システム開発・保守を担当',
          employeeCount: 2,
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z'
        },
        {
          id: '3',
          name: '総務部',
          description: '人事・総務業務を担当',
          employeeCount: 1,
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-05T00:00:00Z'
        }
      ];
      setDepartments(fallbackData);
      setFilteredDepartments(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // フィルタリング処理
  useEffect(() => {
    if (!Array.isArray(departments)) return;
    
    let filtered = [...departments];
    
    // 検索フィルタ
    if (searchTerm) {
      filtered = filtered.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // ソート
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'employeeCount':
          return (b.employeeCount || 0) - (a.employeeCount || 0);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredDepartments(filtered);
  }, [departments, searchTerm, selectedSort]);

  // フォーム関連
  const validateForm = (): boolean => {
    const errors: any = {};
    
    if (!formData.name.trim()) {
      errors.name = '部署名を入力してください';
    } else {
      const existingDept = departments.find(dept => 
        dept.name === formData.name.trim() && 
        (!editingDepartment || dept.id !== editingDepartment.id)
      );
      if (existingDept) {
        errors.name = 'この部署名は既に使用されています';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof CreateDepartmentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      if (modalMode === 'create') {
        const newDeptResponse = await apiService.createDepartment(formData);
        const newDept = (newDeptResponse as any)?.data || newDeptResponse;
        setDepartments(prev => [...prev, newDept]);
        alert('部署を正常に登録しました');
      } else {
        const updatedDeptResponse = await apiService.updateDepartment(editingDepartment!.id, formData);
        const updatedDept = (updatedDeptResponse as any)?.data || updatedDeptResponse;
        setDepartments(prev => prev.map(dept =>
          dept.id === editingDepartment!.id ? updatedDept : dept
        ));
        alert('部署情報を正常に更新しました');
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('処理エラー:', error);
      const errorMessage = modalMode === 'create' ? '部署登録に失敗しました' : '部署情報の更新に失敗しました';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // モーダル操作
  const openCreateModal = () => {
    setModalMode('create');
    setEditingDepartment(null);
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (department: Department) => {
    setModalMode('edit');
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openDeleteDialog = (department: Department) => {
    setDeletingDepartment(department);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingDepartment(null);
  };

  const handleDelete = async () => {
    if (!deletingDepartment) return;
    
    setIsDeleting(true);
    
    try {
      await apiService.deleteDepartment(deletingDepartment.id);
      setDepartments(prev => prev.filter(dept => dept.id !== deletingDepartment.id));
      alert(`${deletingDepartment.name}を削除しました`);
      closeDeleteDialog();
      
    } catch (error: any) {
      console.error('削除エラー:', error);
      alert('部署の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMode('create');
    setEditingDepartment(null);
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
      {/* ヘッダー - 社員管理と同じクラス名 */}
      <div className="content-header">
        <div>
          <h1 className="content-title">部署管理</h1>
          <p className="content-subtitle">部署情報の閲覧・編集・管理を行います</p>
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
      
      {/* 検索・フィルタ - 社員管理と同じクラス名 */}
      <div className="search-filters">
        <input
          type="text"
          className="search-input"
          placeholder="部署名で検索..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={selectedSort}
          onChange={e => setSelectedSort(e.target.value)}
        >
          <option value="name">部署名順</option>
          <option value="employeeCount">社員数順</option>
          <option value="createdAt">作成日順</option>
        </select>
      </div>
      
      {/* テーブル - 社員管理と同じクラス名 */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>部署</th>
              <th>説明</th>
              <th>所属社員数</th>
              <th>作成日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredDepartments) && filteredDepartments.length > 0 ? (
              filteredDepartments.map(dept => (
                <tr key={dept.id}>
                  <td>
                    <div className="employee-info">
                      <div className="avatar">🏢</div>
                      <div className="employee-details">
                        <div className="employee-name">{dept.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{dept.description || '-'}</td>
                  <td>
                    <span className="badge badge-blue">
                      {dept.employeeCount || 0}名
                    </span>
                  </td>
                  <td>{new Date(dept.createdAt).toLocaleDateString('ja-JP')}</td>
                  <td>
                    <div className="action-links">
                      <a 
                        href="#" 
                        className="action-link edit"
                        onClick={(e) => {
                          e.preventDefault();
                          openEditModal(dept);
                        }}
                      >
                        編集
                      </a>
                      <a 
                        href="#" 
                        className="action-link delete"
                        onClick={(e) => {
                          e.preventDefault();
                          openDeleteDialog(dept);
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
                <td colSpan={5} style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px',
                  color: '#6b7280',
                  fontSize: '14px' 
                }}>
                  {loading ? 'データを読み込み中...' : 'データがありません'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* ページネーション */}
        <div className="pagination">
          <div className="pagination-info">
            1 から {filteredDepartments.length} まで表示（全 {departments.length} 件中）
          </div>
          <div className="pagination-controls">
            <button className="page-btn" disabled>前へ</button>
            <button className="page-btn active">1</button>
            <button className="page-btn" disabled>次へ</button>
          </div>
        </div>
      </div>

      {/* 新規登録・編集モーダル */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {modalMode === 'create' ? '新規部署登録' : '部署情報編集'}
              </h2>
              <button 
                type="button"
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 部署名 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    部署名 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${formErrors.name ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="部署名を入力"
                  />
                  {formErrors.name && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>{formErrors.name}</span>
                  )}
                </div>

                {/* 説明 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>説明</label>
                  <textarea
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="部署の説明を入力（任意）"
                  />
                </div>
              </div>

              <div style={{
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    fontSize: '14px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? 
                    (modalMode === 'create' ? '登録中...' : '更新中...') : 
                    (modalMode === 'create' ? '登録' : '更新')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {isDeleteDialogOpen && deletingDepartment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#dc2626',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                削除確認
              </h3>
            </div>
            
            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 16px 0', color: '#374151' }}>
                以下の部署を削除してもよろしいですか？
              </p>
              
              <div style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: '600', color: '#111827' }}>
                  {deletingDepartment.name}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  所属社員数: {deletingDepartment.employeeCount || 0}名
                </div>
              </div>
              
              <p style={{ margin: '0 0 24px 0', color: '#dc2626', fontSize: '14px' }}>
                この操作は取り消せません。
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={closeDeleteDialog}
                  disabled={isDeleting}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.5 : 1
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: isDeleting ? '#9ca3af' : '#dc2626',
                    color: 'white',
                    fontSize: '14px',
                    cursor: isDeleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isDeleting ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DepartmentListPage;