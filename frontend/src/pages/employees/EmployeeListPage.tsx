import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { apiService } from '../../services/api';
import { Employee, Department, Position, NewEmployeeForm, EMPLOYMENT_TYPE_CONFIG } from '../../types';

const EmployeeListPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 検索・フィルタ関連
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // モーダル関連のstate
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<NewEmployeeForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    positionId: '',
    employmentType: 'REGULAR',
    hireDate: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<NewEmployeeForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 削除確認ダイアログ関連のstate
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 詳細表示モーダル関連のstate
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);

  // データ取得
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // APIサービスが利用できるかチェック
      if (typeof apiService === 'undefined' || !apiService.getEmployees) {
        // フォールバック：モックデータを使用
        console.warn('APIサービスが利用できません。モックデータを使用します。');
        
        const mockEmployees = [
          {
            id: '1',
            employeeId: 'EMP001',
            firstName: '太郎',
            lastName: '田中',
            email: 'tanaka@company.com',
            phone: '090-1234-5678',
            department: { id: '1', name: '総務部' },
            position: { id: '1', name: '代表取締役' },
            employmentType: 'REGULAR' as const,
            hireDate: '2020-04-01',
            createdAt: '2020-04-01T00:00:00Z',
            updatedAt: '2020-04-01T00:00:00Z'
          },
          {
            id: '2',
            employeeId: 'EMP002',
            firstName: '花子',
            lastName: '佐藤',
            email: 'sato@company.com',
            phone: '090-2345-6789',
            department: { id: '2', name: '営業部' },
            position: { id: '2', name: '部長' },
            employmentType: 'REGULAR' as const,
            hireDate: '2021-04-01',
            createdAt: '2021-04-01T00:00:00Z',
            updatedAt: '2021-04-01T00:00:00Z'
          }
        ];
        
        const mockDepartments = [
          { id: '1', name: '総務部' },
          { id: '2', name: '営業部' },
          { id: '3', name: '開発部' }
        ];
        
        const mockPositions = [
          { id: '1', name: '代表取締役' },
          { id: '2', name: '部長' },
          { id: '3', name: '課長' }
        ];
        
        // モックデータで遅延をシミュレート
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setEmployees(mockEmployees);
        setFilteredEmployees(mockEmployees);
        setDepartments(mockDepartments);
        setPositions(mockPositions);
        
        return;
      }
      
      // 並列でデータを取得
      const [employeesData, departmentsData, positionsData] = await Promise.all([
        apiService.getEmployees(),
        apiService.getDepartments(),
        apiService.getPositions()
      ]);

      setEmployees(Array.isArray(employeesData?.data) ? employeesData.data : []);
      setFilteredEmployees(Array.isArray(employeesData?.data) ? employeesData.data : []);
      setDepartments(Array.isArray(departmentsData?.data) ? departmentsData.data : []);
      setPositions(Array.isArray(positionsData?.data) ? positionsData.data : []);
      
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました。ページを再読み込みしてください。');
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング処理
  useEffect(() => {
    if (!Array.isArray(employees)) return;
    
    let filtered = [...employees];
    
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.firstName.includes(searchTerm) ||
        emp.lastName.includes(searchTerm) ||
        emp.email.includes(searchTerm)
      );
    }
    
    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.department.name === selectedDepartment);
    }
    
    if (selectedPosition) {
      filtered = filtered.filter(emp => emp.position.name === selectedPosition);
    }
    
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [employees, searchTerm, selectedDepartment, selectedPosition]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = Array.isArray(filteredEmployees) ? filteredEmployees.slice(startIndex, endIndex) : [];

  // フォーム関連の関数
  const validateForm = (): boolean => {
    const errors: Partial<NewEmployeeForm> = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = '名前を入力してください';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = '姓を入力してください';
    }
    if (!formData.email.trim()) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください';
    } else {
      // 編集モードの場合は、編集中の社員以外でメール重複をチェック
      const existingEmployee = employees.find(emp => emp.email === formData.email);
      if (existingEmployee && (!editingEmployee || existingEmployee.id !== editingEmployee.id)) {
        errors.email = 'このメールアドレスは既に使用されています';
      }
    }
    if (!formData.departmentId) {
      errors.departmentId = '部署を選択してください';
    }
    if (!formData.positionId) {
      errors.positionId = '役職を選択してください';
    }
    if (!formData.hireDate) {
      errors.hireDate = '入社日を入力してください';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof NewEmployeeForm, value: string) => {
    setFormData((prev: NewEmployeeForm) => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (formErrors[field]) {
      setFormErrors((prev: Partial<NewEmployeeForm>) => ({ ...prev, [field]: undefined }));
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
        const newEmployeeResponse = await apiService.createEmployee(formData);
        setEmployees(prev => [...prev, newEmployeeResponse.data]);
        alert('社員を正常に登録しました');
        
      } else {
        // 編集処理
        const updatedEmployeeResponse = await apiService.updateEmployee(editingEmployee!.id, formData);
        setEmployees(prev => prev.map(emp => 
          emp.id === editingEmployee!.id ? updatedEmployeeResponse.data : emp
        ));
        alert('社員情報を正常に更新しました');
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('処理エラー:', error);
      const errorMessage = error.response?.data?.message || 
        (modalMode === 'create' ? '社員登録に失敗しました' : '社員情報の更新に失敗しました');
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: '',
      positionId: '',
      employmentType: 'REGULAR',
      hireDate: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setModalMode('edit');
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      departmentId: employee.department.id,
      positionId: employee.position.id,
      employmentType: employee.employmentType,
      hireDate: employee.hireDate
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openDeleteDialog = (employee: Employee) => {
    setDeletingEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingEmployee(null);
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    
    setIsDeleting(true);
    
    try {
      await apiService.deleteEmployee(deletingEmployee.id);
      setEmployees(prev => prev.filter(emp => emp.id !== deletingEmployee.id));
      alert(`${deletingEmployee.lastName} ${deletingEmployee.firstName}さんを削除しました`);
      closeDeleteDialog();
      
    } catch (error: any) {
      console.error('削除エラー:', error);
      const errorMessage = error.response?.data?.message || '社員の削除に失敗しました';
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDetailModal = (employee: Employee) => {
    setDetailEmployee(employee);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailEmployee(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMode('create');
    setEditingEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: '',
      positionId: '',
      employmentType: 'REGULAR',
      hireDate: ''
    });
    setFormErrors({});
  };

  // UIコンポーネント
  const EmploymentTypeBadge: React.FC<{ type: Employee['employmentType'] }> = ({ type }) => {
    const config = EMPLOYMENT_TYPE_CONFIG[type];
    return <span className={config.className}>{config.label}</span>;
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

  // エラー表示
  if (error) {
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
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <p style={{ color: '#dc2626', fontSize: '16px', fontWeight: '500' }}>エラーが発生しました</p>
          <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>{error}</p>
          <button
            onClick={loadInitialData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            再読み込み
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="content-header">
        <div>
          <h1 className="content-title">社員管理</h1>
          <p className="content-subtitle">社員情報の閲覧・編集・管理を行います</p>
        </div>
        <button className="add-btn" onClick={openCreateModal}>
          <span>+</span>
          <span>新規登録</span>
        </button>
      </div>
      
      <div className="search-filters">
        <input
          type="text"
          className="search-input"
          placeholder="社員名で検索..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={selectedDepartment}
          onChange={e => setSelectedDepartment(e.target.value)}
        >
          <option value="">すべての部署</option>
          {Array.isArray(departments) && departments.map(dep => (
            <option key={dep.id} value={dep.name}>{dep.name}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={selectedPosition}
          onChange={e => setSelectedPosition(e.target.value)}
        >
          <option value="">すべての役職</option>
          {Array.isArray(positions) && positions.map(pos => (
            <option key={pos.id} value={pos.name}>{pos.name}</option>
          ))}
        </select>
      </div>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>社員</th>
              <th>部署</th>
              <th>役職</th>
              <th>雇用形態</th>
              <th>入社日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(currentEmployees) && currentEmployees.length > 0 ? (
              currentEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="employee-info">
                      <div className="avatar">{emp.lastName[0]}</div>
                      <div className="employee-details">
                        <div className="employee-name">{emp.lastName} {emp.firstName}</div>
                        <div className="employee-email">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{emp.department.name}</td>
                  <td>{emp.position.name}</td>
                  <td><EmploymentTypeBadge type={emp.employmentType} /></td>
                  <td>{emp.hireDate}</td>
                  <td>
                    <div className="action-links">
                      <a 
                        href="#" 
                        className="action-link"
                        onClick={(e) => {
                          e.preventDefault();
                          openDetailModal(emp);
                        }}
                      >
                        詳細
                      </a>
                      <a 
                        href="#" 
                        className="action-link edit"
                        onClick={(e) => {
                          e.preventDefault();
                          openEditModal(emp);
                        }}
                      >
                        編集
                      </a>
                      <a 
                        href="#" 
                        className="action-link delete"
                        onClick={(e) => {
                          e.preventDefault();
                          openDeleteDialog(emp);
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
                <td colSpan={6} style={{ 
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
        
        <div className="pagination">
          <div className="pagination-info">
            {!Array.isArray(filteredEmployees) || filteredEmployees.length === 0
              ? '0 件'
              : `${startIndex + 1} から ${Math.min(endIndex, filteredEmployees.length)} まで表示 (全 ${filteredEmployees.length} 件中)`}
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
                {modalMode === 'create' ? '新規社員登録' : '社員情報編集'}
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
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                {/* 姓・名 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    姓 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${formErrors.lastName ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    value={formData.lastName}
                    onChange={e => handleInputChange('lastName', e.target.value)}
                    placeholder="田中"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = formErrors.lastName ? '#ef4444' : '#d1d5db'}
                  />
                  {formErrors.lastName && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>{formErrors.lastName}</span>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    名 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${formErrors.firstName ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    value={formData.firstName}
                    onChange={e => handleInputChange('firstName', e.target.value)}
                    placeholder="太郎"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = formErrors.firstName ? '#ef4444' : '#d1d5db'}
                  />
                  {formErrors.firstName && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>{formErrors.firstName}</span>
                  )}
                </div>

                {/* メールアドレス */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    メールアドレス <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${formErrors.email ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    placeholder="tanaka@company.com"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = formErrors.email ? '#ef4444' : '#d1d5db'}
                  />
                  {formErrors.email && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>{formErrors.email}</span>
                  )}
                </div>

                {/* 電話番号 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>電話番号</label>
                  <input
                    type="tel"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    placeholder="090-1234-5678"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* 部署 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    部署 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${formErrors.departmentId ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      backgroundColor: 'white'
                    }}
                    value={formData.departmentId}
                    onChange={e => handleInputChange('departmentId', e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = formErrors.departmentId ? '#ef4444' : '#d1d5db'}
                  >
                    <option value="">部署を選択してください</option>
                    {Array.isArray(departments) && departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {formErrors.departmentId && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>{formErrors.departmentId}</span>
                  )}
                </div>

                {/* 役職 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    役職 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${formErrors.positionId ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      backgroundColor: 'white'
                    }}
                    value={formData.positionId}
                    onChange={e => handleInputChange('positionId', e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = formErrors.positionId ? '#ef4444' : '#d1d5db'}
                  >
                    <option value="">役職を選択してください</option>
                    {Array.isArray(positions) && positions.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                  {formErrors.positionId && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>{formErrors.positionId}</span>
                  )}
                </div>

                {/* 雇用形態 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    雇用形態 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      backgroundColor: 'white'
                    }}
                    value={formData.employmentType}
                    onChange={e => handleInputChange('employmentType', e.target.value as NewEmployeeForm['employmentType'])}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="REGULAR">正社員</option>
                    <option value="CONTRACT">契約社員</option>
                    <option value="TEMPORARY">派遣</option>
                    <option value="PART_TIME">アルバイト</option>
                  </select>
                </div>

                {/* 入社日 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    入社日 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${formErrors.hireDate ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    value={formData.hireDate}
                    onChange={e => handleInputChange('hireDate', e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = formErrors.hireDate ? '#ef4444' : '#d1d5db'}
                  />
                  {formErrors.hireDate && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>{formErrors.hireDate}</span>
                  )}
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
      {isDeleteDialogOpen && deletingEmployee && (
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
                以下の社員を削除してもよろしいですか？
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
                    {deletingEmployee.lastName[0]}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {deletingEmployee.lastName} {deletingEmployee.firstName}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      {deletingEmployee.department.name} • {deletingEmployee.position.name}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      {deletingEmployee.email}
                    </div>
                  </div>
                </div>
              </div>
              
              <p style={{
                margin: '0 0 24px 0',
                color: '#dc2626',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                この操作は取り消せません。
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

      {/* 社員詳細表示モーダル */}
      {isDetailModalOpen && detailEmployee && (
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
              }}>社員詳細情報</h2>
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
                  {detailEmployee.lastName[0]}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#111827',
                    margin: '0 0 8px 0'
                  }}>
                    {detailEmployee.lastName} {detailEmployee.firstName}
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    margin: '0 0 4px 0'
                  }}>
                    {detailEmployee.department.name} • {detailEmployee.position.name}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    社員ID: {detailEmployee.employeeId}
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
                      }}>メールアドレス</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0',
                        wordBreak: 'break-all'
                      }}>{detailEmployee.email}</p>
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
                      }}>電話番号</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0'
                      }}>{detailEmployee.phone || '未登録'}</p>
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
                      }}>雇用形態</label>
                      <div style={{ padding: '8px 0' }}>
                        <EmploymentTypeBadge type={detailEmployee.employmentType} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 組織情報 */}
                <div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 16px 0',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e5e7eb'
                  }}>組織情報</h4>
                  
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
                      }}>部署</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0'
                      }}>{detailEmployee.department.name}</p>
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
                      }}>役職</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0'
                      }}>{detailEmployee.position.name}</p>
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
                      }}>入社日</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0'
                      }}>{detailEmployee.hireDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* システム情報 */}
              <div style={{ marginTop: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 16px 0',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e5e7eb'
                }}>システム情報</h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
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
                    }}>{new Date(detailEmployee.createdAt).toLocaleString('ja-JP')}</p>
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
                    }}>{new Date(detailEmployee.updatedAt).toLocaleString('ja-JP')}</p>
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
                    openEditModal(detailEmployee);
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

      {/* ローディング用スピナーのCSSアニメーション - moved to inline styles */}
    </Layout>
  );
};

export default EmployeeListPage;