import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { apiService } from '../../services/api';
import { Position, CreatePositionRequest, UpdatePositionRequest } from '../../types';

interface PositionFormData {
  name: string;
  level: number;
  description: string;
}

const PositionListPage: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 検索・フィルタ関連
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // モーダル関連のstate
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState<PositionFormData>({
    name: '',
    level: 1,
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<PositionFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 削除確認ダイアログ関連のstate
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPosition, setDeletingPosition] = useState<Position | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 詳細表示モーダル関連のstate
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailPosition, setDetailPosition] = useState<Position | null>(null);

  // データ取得
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 役職データ取得開始...');
      console.log('APIサービス:', typeof apiService, !!apiService.getPositions);
      
      // APIサービスが利用できるかチェック
      if (typeof apiService === 'undefined' || !apiService.getPositions) {
        // フォールバック：モックデータを使用
        console.warn('⚠️ APIサービスが利用できません。モックデータを使用します。');
        
        const mockPositions = [
          {
            id: '1',
            name: '代表取締役',
            level: 10,
            description: '会社の最高責任者',
            createdAt: '2020-01-01T00:00:00Z',
            updatedAt: '2020-01-01T00:00:00Z',
            deletedAt: null
          },
          {
            id: '2',
            name: '取締役',
            level: 9,
            description: '経営陣の一員',
            createdAt: '2020-01-01T00:00:00Z',
            updatedAt: '2020-01-01T00:00:00Z',
            deletedAt: null
          },
          {
            id: '3',
            name: '部長',
            level: 8,
            description: '部門の責任者',
            createdAt: '2020-01-01T00:00:00Z',
            updatedAt: '2020-01-01T00:00:00Z',
            deletedAt: null
          },
          {
            id: '4',
            name: '課長',
            level: 7,
            description: '課の責任者',
            createdAt: '2020-01-01T00:00:00Z',
            updatedAt: '2020-01-01T00:00:00Z',
            deletedAt: null
          },
          {
            id: '5',
            name: '主任',
            level: 6,
            description: 'チームリーダー',
            createdAt: '2020-01-01T00:00:00Z',
            updatedAt: '2020-01-01T00:00:00Z',
            deletedAt: null
          }
        ];
        
        // モックデータで遅延をシミュレート
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setPositions(mockPositions);
        setFilteredPositions(mockPositions);
        
        return;
      }
      
      console.log('🌐 実際のAPIを呼び出し中...');
      
      // 役職データを取得
      const positionsResponse = await apiService.getPositions();

      console.log('✅ API応答受信:', { positionsResponse });

      // レスポンスからデータを取得
      const positionsData = (positionsResponse as any)?.data || positionsResponse || [];

      setPositions(Array.isArray(positionsData) ? positionsData : []);
      setFilteredPositions(Array.isArray(positionsData) ? positionsData : []);
      
    } catch (err) {
      console.error('❌ 役職データ取得エラー:', err);
      console.log('🔄 モックデータフォールバックに切り替え中...');
      
      // 認証エラーやその他のAPIエラー時にモックデータを使用
      const mockPositions = [
        {
          id: '1',
          name: '代表取締役',
          level: 10,
          description: '会社の最高責任者',
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2020-01-01T00:00:00Z',
          deletedAt: null
        },
        {
          id: '2',
          name: '取締役',
          level: 9,
          description: '経営陣の一員',
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2020-01-01T00:00:00Z',
          deletedAt: null
        },
        {
          id: '3',
          name: '部長',
          level: 8,
          description: '部門の責任者',
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2020-01-01T00:00:00Z',
          deletedAt: null
        },
        {
          id: '4',
          name: '課長',
          level: 7,
          description: '課の責任者',
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2020-01-01T00:00:00Z',
          deletedAt: null
        },
        {
          id: '5',
          name: '主任',
          level: 6,
          description: 'チームリーダー',
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2020-01-01T00:00:00Z',
          deletedAt: null
        },
        {
          id: '6',
          name: '主席',
          level: 5,
          description: '専門職上級',
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2020-01-01T00:00:00Z',
          deletedAt: null
        },
        {
          id: '7',
          name: 'senior',
          level: 4,
          description: 'シニア職',
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2020-01-01T00:00:00Z',
          deletedAt: null
        },
        {
          id: '8',
          name: '一般職',
          level: 1,
          description: '一般職員',
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2020-01-01T00:00:00Z',
          deletedAt: null
        }
      ];
      
      setPositions(mockPositions);
      setFilteredPositions(mockPositions);
      
      // エラーメッセージを表示（認証エラーの場合は特別なメッセージ）
      if (err instanceof Error && err.message.includes('認証')) {
        setError('ログインが必要です。ログインするか、デモデータでの表示を継続します。');
      } else {
        setError('API接続に失敗しました。デモデータを表示しています。');
      }
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング処理
  useEffect(() => {
    if (!Array.isArray(positions)) return;
    
    let filtered = [...positions];
    
    if (searchTerm) {
      filtered = filtered.filter(position => 
        position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (position.description && position.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredPositions(filtered);
    setCurrentPage(1);
  }, [positions, searchTerm]);

  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPositions = Array.isArray(filteredPositions) ? filteredPositions.slice(startIndex, endIndex) : [];

  // フォーム関連の関数
  const validateForm = (): boolean => {
    const errors: Partial<PositionFormData> = {};
    
    if (!formData.name.trim()) {
      errors.name = '役職名を入力してください';
    } else {
      // 編集モードの場合は、編集中の役職以外で名前重複をチェック
      const existingPosition = positions.find(pos => pos.name === formData.name);
      if (existingPosition && (!editingPosition || existingPosition.id !== editingPosition.id)) {
        errors.name = 'この役職名は既に使用されています';
      }
    }
    
    if (!formData.level || formData.level < 1 || formData.level > 10) {
      errors.level = 'レベルは1から10の間で入力してください';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof PositionFormData, value: string | number) => {
    setFormData((prev: PositionFormData) => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (formErrors[field]) {
      setFormErrors((prev: Partial<PositionFormData>) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (modalMode === 'create') {
        // 新規登録処理
        const createData: CreatePositionRequest = {
          name: formData.name,
          level: formData.level,
          ...(formData.description && { description: formData.description })
        };
        
        const newPositionResponse = await apiService.createPosition(createData);
        const newPosition = (newPositionResponse as any)?.data || newPositionResponse;
        setPositions(prev => [...prev, newPosition]);
        alert('役職を正常に登録しました');
        
      } else {
        // 編集処理
        const updateData: UpdatePositionRequest = {
          name: formData.name,
          level: formData.level,
          ...(formData.description && { description: formData.description })
        };
        
        const updatedPositionResponse = await apiService.updatePosition(editingPosition!.id, updateData);
        const updatedPosition = (updatedPositionResponse as any)?.data || updatedPositionResponse;
        setPositions(prev => prev.map(pos => 
          pos.id === editingPosition!.id ? updatedPosition : pos
        ));
        alert('役職情報を正常に更新しました');
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('処理エラー:', error);
      const errorMessage = error.response?.data?.message || 
        (modalMode === 'create' ? '役職登録に失敗しました' : '役職情報の更新に失敗しました');
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingPosition(null);
    setFormData({
      name: '',
      level: 1,
      description: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (position: Position) => {
    setModalMode('edit');
    setEditingPosition(position);
    setFormData({
      name: position.name,
      level: position.level,
      description: position.description || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openDeleteDialog = (position: Position) => {
    setDeletingPosition(position);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingPosition(null);
  };

  const handleDelete = async () => {
    if (!deletingPosition) return;
    
    setIsDeleting(true);
    
    try {
      await apiService.deletePosition(deletingPosition.id);
      setPositions(prev => prev.filter(pos => pos.id !== deletingPosition.id));
      alert(`役職「${deletingPosition.name}」を削除しました`);
      closeDeleteDialog();
      
    } catch (error: any) {
      console.error('削除エラー:', error);
      const errorMessage = error.response?.data?.message || '役職の削除に失敗しました';
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDetailModal = (position: Position) => {
    setDetailPosition(position);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailPosition(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMode('create');
    setEditingPosition(null);
    setFormData({
      name: '',
      level: 1,
      description: ''
    });
    setFormErrors({});
  };

  // UIコンポーネント
  const LevelBadge: React.FC<{ level: number }> = ({ level }) => {
    const getBadgeStyle = (level: number) => {
      if (level >= 8) {
        return {
          backgroundColor: '#fef3c7',
          color: '#d97706',
          border: '1px solid #fbbf24'
        };
      } else if (level >= 5) {
        return {
          backgroundColor: '#dbeafe',
          color: '#2563eb',
          border: '1px solid #93c5fd'
        };
      } else {
        return {
          backgroundColor: '#f3f4f6',
          color: '#6b7280',
          border: '1px solid #d1d5db'
        };
      }
    };

    const style = getBadgeStyle(level);
    
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        ...style
      }}>
        レベル {level}
      </span>
    );
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
          <p style={{ color: '#6b7280', fontSize: '14px' }}>役職データを読み込み中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="content-header">
        <div>
          <h1 className="content-title">役職管理</h1>
          <p className="content-subtitle">役職情報の閲覧・編集・管理を行います</p>
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
              cursor: 'pointer'
            }}
          >×</button>
        </div>
      )}
      
      <div className="search-filters">
        <input
          type="text"
          className="search-input"
          placeholder="役職名で検索..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>役職名</th>
              <th>レベル</th>
              <th>説明</th>
              <th>作成日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(currentPositions) && currentPositions.length > 0 ? (
              currentPositions.map(position => (
                <tr key={position.id}>
                  <td>
                    <div className="employee-info">
                      <div className="avatar">🎯</div>
                      <div className="employee-details">
                        <div className="employee-name">{position.name}</div>
                      </div>
                    </div>
                  </td>
                  <td><LevelBadge level={position.level} /></td>
                  <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                    {position.description || '-'}
                  </td>
                  <td>{new Date(position.createdAt).toLocaleDateString('ja-JP')}</td>
                  <td>
                    <div className="action-links">
                      <a 
                        href="#" 
                        className="action-link"
                        onClick={(e) => {
                          e.preventDefault();
                          openDetailModal(position);
                        }}
                      >
                        詳細
                      </a>
                      <a 
                        href="#" 
                        className="action-link edit"
                        onClick={(e) => {
                          e.preventDefault();
                          openEditModal(position);
                        }}
                      >
                        編集
                      </a>
                      <a 
                        href="#" 
                        className="action-link delete"
                        onClick={(e) => {
                          e.preventDefault();
                          openDeleteDialog(position);
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
                  {loading ? '役職データを読み込み中...' : 'データがありません'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="pagination">
          <div className="pagination-info">
            {!Array.isArray(filteredPositions) || filteredPositions.length === 0
              ? '0 件'
              : `${startIndex + 1} から ${Math.min(endIndex, filteredPositions.length)} まで表示 (全 ${filteredPositions.length} 件中)`}
          </div>
          <div className="pagination-controls">
            <button className="page-btn" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>前へ</button>
            {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`page-btn${currentPage === i + 1 ? ' active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button className="page-btn" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>次へ</button>
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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
                {modalMode === 'create' ? '新規役職登録' : '役職情報編集'}
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
                  padding: '4px',
                  lineHeight: 1
                }}
              >×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 200px',
                gap: '16px'
              }}>
                {/* 役職名 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    役職名 <span style={{ color: '#ef4444' }}>*</span>
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
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="役職名を入力"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = formErrors.name ? '#ef4444' : '#d1d5db'}
                  />
                  {formErrors.name && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>{formErrors.name}</span>
                  )}
                </div>

                {/* レベル */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    レベル <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${formErrors.level ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    value={formData.level}
                    onChange={e => handleInputChange('level', parseInt(e.target.value) || 1)}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = formErrors.level ? '#ef4444' : '#d1d5db'}
                  />
                  {formErrors.level && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>{formErrors.level}</span>
                  )}
                </div>

                {/* 説明 */}
                <div style={{ gridColumn: '1 / -1' }}>
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
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="役職の詳細説明（任意）"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
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
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = '#f9fafb'}
                  onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = 'white'}
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
                    fontWeight: '500',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (!isSubmitting) (e.target as HTMLElement).style.backgroundColor = '#2563eb';
                  }}
                  onMouseLeave={e => {
                    if (!isSubmitting) (e.target as HTMLElement).style.backgroundColor = '#3b82f6';
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
      {isDeleteDialogOpen && deletingPosition && (
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
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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
                <span style={{ fontSize: '24px' }}>⚠️</span>
                削除確認
              </h3>
            </div>
            
            <div style={{ padding: '24px' }}>
              <p style={{
                margin: '0 0 16px 0',
                color: '#374151',
                lineHeight: 1.6
              }}>
                以下の役職を削除してもよろしいですか？
              </p>
              
              <div style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    🎯
                  </div>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {deletingPosition.name}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      レベル {deletingPosition.level}
                    </div>
                    {deletingPosition.description && (
                      <div style={{
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        {deletingPosition.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <p style={{
                margin: '0 0 24px 0',
                color: '#dc2626',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                注意：この役職を使用している社員がいる場合は削除できません。
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={closeDeleteDialog}
                  disabled={isDeleting}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    opacity: isDeleting ? 0.5 : 1
                  }}
                  onMouseEnter={e => {
                    if (!isDeleting) (e.target as HTMLElement).style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={e => {
                    if (!isDeleting) (e.target as HTMLElement).style.backgroundColor = 'white';
                  }}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: isDeleting ? '#9ca3af' : '#dc2626',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (!isDeleting) (e.target as HTMLElement).style.backgroundColor = '#b91c1c';
                  }}
                  onMouseLeave={e => {
                    if (!isDeleting) (e.target as HTMLElement).style.backgroundColor = '#dc2626';
                  }}
                >
                  {isDeleting ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 役職詳細表示モーダル */}
      {isDetailModalOpen && detailPosition && (
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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
              }}>役職詳細情報</h2>
              <button 
                type="button"
                onClick={closeDetailModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                  lineHeight: 1
                }}
              >×</button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {/* プロフィール部分 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: '600',
                  color: '#6b7280'
                }}>
                  🎯
                </div>
                <div>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#111827',
                    margin: '0 0 8px 0'
                  }}>
                    {detailPosition.name}
                  </h3>
                  <div style={{ marginBottom: '8px' }}>
                    <LevelBadge level={detailPosition.level} />
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {detailPosition.description || '説明なし'}
                  </p>
                </div>
              </div>

              {/* 詳細情報 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px'
              }}>
                {/* 基本情報 */}
                <div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 16px 0',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e5e7eb'
                  }}>基本情報</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px'
                      }}>役職名</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0'
                      }}>{detailPosition.name}</p>
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px'
                      }}>レベル</label>
                      <div style={{ padding: '8px 0' }}>
                        <LevelBadge level={detailPosition.level} />
                      </div>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px'
                      }}>説明</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0',
                        wordBreak: 'break-word'
                      }}>{detailPosition.description || '説明なし'}</p>
                    </div>
                  </div>
                </div>

                {/* システム情報 */}
                <div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 16px 0',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e5e7eb'
                  }}>システム情報</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px'
                      }}>登録日時</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0'
                      }}>{new Date(detailPosition.createdAt).toLocaleString('ja-JP')}</p>
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px'
                      }}>最終更新</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0'
                      }}>{new Date(detailPosition.updatedAt).toLocaleString('ja-JP')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div style={{
                marginTop: '32px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={closeDetailModal}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = '#f9fafb'}
                  onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = 'white'}
                >
                  閉じる
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeDetailModal();
                    openEditModal(detailPosition);
                  }}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
                  onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = '#3b82f6'}
                >
                  編集する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PositionListPage;