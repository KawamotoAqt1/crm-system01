import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { apiService } from '../../services/api';
import { Employee, Department, Position, Area, NewEmployeeForm, EMPLOYMENT_TYPE_CONFIG } from '../../types';
import { areaApi } from '../../services/areaApi';
import EmployeeImportModal from '../../components/employees/EmployeeImportModal';

const EmployeeListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 強調表示用の社員ID
  const [highlightedEmployeeId, setHighlightedEmployeeId] = useState<string | null>(null);
  
  // 検索・フィルタ関連
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // モーダル関連のstate
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<NewEmployeeForm>({
    employeeId: '',
    firstName: '',
    lastName: '',
    firstNameKana: '',
    lastNameKana: '',
    email: '',
    phone: '',
    departmentId: '',
    positionId: '',
    areaId: '',
    employmentType: 'REGULAR',
    hireDate: '',
    birthDate: '',
    address: '',
    emergencyContact: '',
    education: '',
    workHistory: '',
    skills: '',
    photoUrl: '',
    notes: ''
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
  
  // CSVエクスポート関連のstate
  const [isExporting, setIsExporting] = useState(false);
  
  // CSVインポート関連のstate
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 写真関連のstate
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  // データ取得
  useEffect(() => {
    loadInitialData();
  }, []);

  // URLパラメータから強調表示対象を取得
  useEffect(() => {
    const highlightParam = searchParams.get('highlight');
    if (highlightParam) {
      setHighlightedEmployeeId(highlightParam);
      // URLパラメータをクリア（履歴に残さない）
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('highlight');
      setSearchParams(newSearchParams, { replace: true });
      
      // 5秒後に強調表示を解除
      setTimeout(() => {
        setHighlightedEmployeeId(null);
      }, 5000);
    }
  }, [searchParams, setSearchParams]);

  // エリアデータの変更を監視
  useEffect(() => {
    console.log('🏢 エリアデータが更新されました:', areas, 'length:', areas.length);
  }, [areas]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 データ取得開始...');
      console.log('APIサービス:', typeof apiService, !!apiService.getEmployees);
      
      // APIサービスが利用できるかチェック
      if (typeof apiService === 'undefined' || !apiService.getEmployees) {
        // フォールバック：モックデータを使用
        console.warn('⚠️ APIサービスが利用できません。モックデータを使用します。');
        
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
          { id: '1', name: '総務部', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
          { id: '2', name: '営業部', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
          { id: '3', name: '開発部', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' }
        ];
        
        const mockPositions = [
          { id: '1', name: '代表取締役', level: 10, createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
          { id: '2', name: '部長', level: 8, createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
          { id: '3', name: '課長', level: 7, createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' }
        ];
        
        // モックデータで遅延をシミュレート
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setEmployees(mockEmployees);
        setFilteredEmployees(mockEmployees);
        setDepartments(mockDepartments);
        setPositions(mockPositions);
        
        return;
      }
      
      console.log('🌐 実際のAPIを呼び出し中...');
      
      // 並列でデータを取得
      const [employeesResponse, departmentsResponse, positionsResponse, areasResponse] = await Promise.all([
        apiService.getEmployees(),
        apiService.getDepartments(),
        apiService.getPositions(),
        areaApi.getAll()
      ]);

      console.log('✅ API応答受信:', { employeesResponse, departmentsResponse, positionsResponse, areasResponse });

      // レスポンスからデータを取得
      const employeesData = (employeesResponse as any)?.data || employeesResponse || [];
      const departmentsData = (departmentsResponse as any)?.data || departmentsResponse || [];
      const positionsData = (positionsResponse as any)?.data || positionsResponse || [];
      const areasData = Array.isArray(areasResponse) ? areasResponse : [];

      console.log('📊 取得したエリアデータ:', areasData);

      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setFilteredEmployees(Array.isArray(employeesData) ? employeesData : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      setPositions(Array.isArray(positionsData) ? positionsData : []);
      setAreas(areasData);
      
    } catch (err) {
      console.error('❌ データ取得エラー:', err);
      console.log('🔄 モックデータフォールバックに切り替え中...');
      
      // 認証エラーやその他のAPIエラー時にモックデータを使用
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
        },
        {
          id: '3',
          employeeId: 'EMP003',
          firstName: '一郎',
          lastName: '鈴木',
          email: 'suzuki@company.com',
          phone: '090-3456-7890',
          department: { id: '2', name: '営業部' },
          position: { id: '3', name: '課長' },
          employmentType: 'REGULAR' as const,
          hireDate: '2022-07-01',
          createdAt: '2022-07-01T00:00:00Z',
          updatedAt: '2022-07-01T00:00:00Z'
        },
        {
          id: '4',
          employeeId: 'EMP004',
          firstName: '美咲',
          lastName: '高橋',
          email: 'takahashi@company.com',
          phone: '090-4567-8901',
          department: { id: '3', name: '開発部' },
          position: { id: '4', name: '主任' },
          employmentType: 'REGULAR' as const,
          hireDate: '2023-04-01',
          createdAt: '2023-04-01T00:00:00Z',
          updatedAt: '2023-04-01T00:00:00Z'
        },
        {
          id: '5',
          employeeId: 'EMP005',
          firstName: '健太',
          lastName: '山田',
          email: 'yamada@company.com',
          phone: '090-5678-9012',
          department: { id: '2', name: '営業部' },
          position: { id: '5', name: '一般職' },
          employmentType: 'REGULAR' as const,
          hireDate: '2024-04-01',
          createdAt: '2024-04-01T00:00:00Z',
          updatedAt: '2024-04-01T00:00:00Z'
        }
      ];
      
      const mockDepartments = [
        { id: '1', name: '総務部', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
        { id: '2', name: '営業部', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
        { id: '3', name: '開発部', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' }
      ];
      
      const mockPositions = [
        { id: '1', name: '代表取締役', level: 10, createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
        { id: '2', name: '部長', level: 8, createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
        { id: '3', name: '課長', level: 7, createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
        { id: '4', name: '主任', level: 6, createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
        { id: '5', name: '一般職', level: 1, createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' }
      ];
      
      setEmployees(mockEmployees);
      setFilteredEmployees(mockEmployees);
      setDepartments(mockDepartments);
      setPositions(mockPositions);
      
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
    if (!Array.isArray(employees)) return;
    
    let filtered = [...employees];
    
    if (searchTerm) {
      filtered = filtered.filter(emp => {
        // グローバル検索と同様の包括的な検索
        const fullName = `${emp.lastName} ${emp.firstName}`;
        const kanaName = emp.lastNameKana && emp.firstNameKana ? 
          `${emp.lastNameKana} ${emp.firstNameKana}` : '';
        
        // 検索対象フィールドを大幅に拡張
        const searchFields = [
          fullName,
          kanaName,
          emp.email,
          emp.employeeId,
          emp.phone,
          emp.address,
          emp.department?.name,
          emp.position?.name,
          emp.area?.name,
          emp.emergencyContact,
          emp.education,
          emp.workHistory,
          emp.skills,
          emp.notes
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchFields.includes(searchTerm.toLowerCase());
      });
    }
    
    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.department.name === selectedDepartment);
    }
    
    if (selectedPosition) {
      filtered = filtered.filter(emp => emp.position.name === selectedPosition);
    }
    
    if (selectedArea) {
      filtered = filtered.filter(emp => emp.area?.name === selectedArea);
    }
    
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [employees, searchTerm, selectedDepartment, selectedPosition, selectedArea]);

  // 強調表示対象の社員が現在のページに表示されるようにページを調整
  useEffect(() => {
    if (highlightedEmployeeId && Array.isArray(filteredEmployees)) {
      const targetIndex = filteredEmployees.findIndex(emp => emp.id === highlightedEmployeeId);
      if (targetIndex !== -1) {
        const targetPage = Math.floor(targetIndex / itemsPerPage) + 1;
        setCurrentPage(targetPage);
      }
    }
  }, [highlightedEmployeeId, filteredEmployees, itemsPerPage]);

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

  // 写真ファイル選択処理
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズは5MB以下にしてください');
        return;
      }

      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
      }

      setSelectedPhoto(file);

      // プレビュー用のURLを作成
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 写真アップロード処理
  const uploadPhoto = async (): Promise<string | null> => {
    if (!selectedPhoto) return null;

    setIsPhotoUploading(true);
    try {
      const response = await apiService.uploadPhoto(selectedPhoto);
      if (response.success) {
        return response.data.photoUrl;
      }
      throw new Error('アップロードに失敗しました');
    } catch (error: any) {
      console.error('写真アップロードエラー:', error);
      alert('写真のアップロードに失敗しました: ' + error.message);
      return null;
    } finally {
      setIsPhotoUploading(false);
    }
  };

  // 写真削除処理
  const handlePhotoDelete = async () => {
    if (!photoPreview) return;

    if (!confirm('現在の写真を削除しますか？')) return;

    try {
      // 既存写真がある場合は削除
      if (formData.photoUrl && formData.photoUrl.startsWith('/uploads/photos/')) {
        const filename = formData.photoUrl.split('/').pop();
        if (filename) {
          await apiService.deletePhoto(filename);
        }
      }

      // フォームとプレビューをクリア
      handleInputChange('photoUrl', '');
      setSelectedPhoto(null);
      setPhotoPreview(null);
      
      alert('写真を削除しました');
    } catch (error: any) {
      console.error('写真削除エラー:', error);
      alert('写真削除に失敗しました: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 写真をアップロードしてURLを取得
      let photoUrl = formData.photoUrl;
      if (selectedPhoto) {
        console.log('写真アップロード開始');
        const uploadedPhotoUrl = await uploadPhoto();
        if (uploadedPhotoUrl) {
          photoUrl = uploadedPhotoUrl;
          console.log('写真アップロード成功:', uploadedPhotoUrl);
        }
      }

      // フォームデータの処理：空文字列をnullに変換
      const cleanFormData = { ...formData, photoUrl };
      
      // 空の文字列をnullに変換（オプショナルフィールド）
      Object.keys(cleanFormData).forEach(key => {
        if (typeof cleanFormData[key as keyof NewEmployeeForm] === 'string' && 
            cleanFormData[key as keyof NewEmployeeForm].trim() === '') {
          if (key !== 'firstName' && key !== 'lastName' && key !== 'email' && 
              key !== 'departmentId' && key !== 'positionId' && key !== 'hireDate') {
            // 必須フィールド以外は空文字列をnullに変換
            (cleanFormData as any)[key] = null;
          }
        }
      });
      
      if (modalMode === 'create') {
        // 新規登録処理
        const requestData = { ...cleanFormData };
        // 空のemployeeIdは除外
        if (!requestData.employeeId || !requestData.employeeId.trim()) {
          delete (requestData as any).employeeId;
        }
        
        console.log('送信データ (新規登録):', requestData);
        const newEmployeeResponse = await apiService.createEmployee(requestData);
        const newEmployee = (newEmployeeResponse as any)?.data || newEmployeeResponse;
        setEmployees(prev => [...prev, newEmployee]);
        alert('社員を正常に登録しました');
        
      } else {
        // 編集処理
        console.log('送信データ (編集):', cleanFormData);
        const updatedEmployeeResponse = await apiService.updateEmployee(editingEmployee!.id, cleanFormData);
        const updatedEmployee = (updatedEmployeeResponse as any)?.data || updatedEmployeeResponse;
        setEmployees(prev => prev.map(emp => 
          emp.id === editingEmployee!.id ? updatedEmployee : emp
        ));
        alert('社員情報を正常に更新しました');
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('処理エラー:', error);
      console.error('エラー詳細:', error.message);
      
      // エラーメッセージを詳細に表示
      let errorMessage = error.message || (modalMode === 'create' ? '社員登録に失敗しました' : '社員情報の更新に失敗しました');
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingEmployee(null);
    setFormData({
      employeeId: '',
      firstName: '',
      lastName: '',
      firstNameKana: '',
      lastNameKana: '',
      email: '',
      phone: '',
      departmentId: '',
      positionId: '',
      areaId: '',
      employmentType: 'REGULAR',
      hireDate: '',
      birthDate: '',
      address: '',
      emergencyContact: '',
      education: '',
      workHistory: '',
      skills: '',
      photoUrl: '',
      notes: ''
    });
    setFormErrors({});
    // 写真関連のstateをリセット
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setModalMode('edit');
    setEditingEmployee(employee);
    setFormData({
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      firstNameKana: employee.firstNameKana || '',
      lastNameKana: employee.lastNameKana || '',
      email: employee.email,
      phone: employee.phone || '',
      departmentId: employee.department.id,
      positionId: employee.position.id,
      areaId: employee.area?.id || '',
      employmentType: employee.employmentType,
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
      birthDate: employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : '',
      address: employee.address || '',
      emergencyContact: employee.emergencyContact || '',
      education: employee.education || '',
      workHistory: employee.workHistory || '',
      skills: employee.skills || '',
      photoUrl: employee.photoUrl || '',
      notes: employee.notes || ''
    });
    setFormErrors({});
    // 写真関連のstateをリセット（既存写真がある場合はプレビューに設定）
    setSelectedPhoto(null);
    if (employee.photoUrl) {
      setPhotoPreview(`http://localhost:3001${employee.photoUrl}`);
    } else {
      setPhotoPreview(null);
    }
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
      employeeId: '',
      firstName: '',
      lastName: '',
      firstNameKana: '',
      lastNameKana: '',
      email: '',
      phone: '',
      departmentId: '',
      positionId: '',
      areaId: '',
      employmentType: 'REGULAR',
      hireDate: '',
      birthDate: '',
      address: '',
      emergencyContact: '',
      education: '',
      workHistory: '',
      skills: '',
      photoUrl: '',
      notes: ''
    });
    setFormErrors({});
    // 写真関連のstateをリセット
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  // CSVエクスポート処理関数
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      
      // 現在のフィルタ条件でエクスポート
      const exportParams: any = {};
      
      if (searchTerm) {
        exportParams.search = searchTerm;
      }
      
      if (selectedDepartment) {
        const department = departments.find(d => d.name === selectedDepartment);
        if (department) {
          exportParams.departmentId = department.id;
        }
      }
      
      if (selectedPosition) {
        const position = positions.find(p => p.name === selectedPosition);
        if (position) {
          exportParams.positionId = position.id;
        }
      }
      
      await apiService.exportEmployeesCSV(exportParams);
      
      // 成功メッセージ（任意）
      alert('CSVファイルのダウンロードを開始しました');
      
    } catch (error: any) {
      console.error('CSVエクスポートエラー:', error);
      alert('CSVエクスポートに失敗しました: ' + (error.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  // CSVインポート関連の関数
  const handleImportModalOpen = () => {
    setIsImportModalOpen(true);
  };

  const handleImportModalClose = () => {
    setIsImportModalOpen(false);
  };

  const handleImportComplete = () => {
    // インポート完了後、データを再取得
    loadInitialData();
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
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* CSVインポートボタン */}
          <button 
            className="add-btn"
            onClick={handleImportModalOpen}
            style={{
              backgroundColor: '#8b5cf6',
              cursor: 'pointer'
            }}
          >
            <span>📥</span>
            <span>CSV取込</span>
          </button>
          
          {/* CSVエクスポートボタン */}
          <button 
            className="add-btn"
            onClick={handleExportCSV}
            disabled={isExporting}
            style={{
              backgroundColor: isExporting ? '#9ca3af' : '#059669',
              cursor: isExporting ? 'not-allowed' : 'pointer'
            }}
          >
            <span>{isExporting ? '📤' : '📊'}</span>
            <span>{isExporting ? 'エクスポート中...' : 'CSV出力'}</span>
          </button>
          
          {/* 新規登録ボタン */}
          <button className="add-btn" onClick={openCreateModal}>
            <span>+</span>
            <span>新規登録</span>
          </button>
        </div>
      </div>
      
      <div className="search-filters">
        <input
          type="text"
          className="search-input"
          placeholder="名前・スキル・学歴・職歴・住所・電話番号など全項目を検索..."
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
        <select
          className="filter-select"
          value={selectedArea}
          onChange={e => setSelectedArea(e.target.value)}
        >
          <option value="">すべてのエリア</option>
          {Array.isArray(areas) && areas.length > 0 ? (
            areas.map(area => (
              <option key={area.id} value={area.name}>{area.name}</option>
            ))
          ) : (
            <option disabled>読み込み中...</option>
          )}
        </select>
      </div>
      
      {/* 検索・フィルタエリアの後に追加 */}
      {(searchTerm || selectedDepartment || selectedPosition) && (
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          padding: '8px 12px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          💡 現在のフィルタ条件（{searchTerm && `検索: "${searchTerm}"`}{selectedDepartment && `, 部署: ${selectedDepartment}`}{selectedPosition && `, 役職: ${selectedPosition}`}）でCSV出力されます
        </div>
      )}
      
      {/* 強調表示通知 */}
      {highlightedEmployeeId && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          color: '#92400e',
          padding: '8px 12px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🎯</span>
          <span>グローバル検索結果から選択された社員がハイライト表示されています（5秒後に自動で解除されます）</span>
        </div>
      )}
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>社員</th>
              <th>部署</th>
              <th>役職</th>
              <th>エリア</th>
              <th>雇用形態</th>
              <th>入社日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(currentEmployees) && currentEmployees.length > 0 ? (
              currentEmployees.map(emp => (
                <tr 
                  key={emp.id}
                  style={{
                    backgroundColor: highlightedEmployeeId === emp.id ? '#fef3c7' : undefined,
                    border: highlightedEmployeeId === emp.id ? '2px solid #f59e0b' : undefined,
                    transition: 'all 0.3s ease',
                    animation: highlightedEmployeeId === emp.id ? 'highlight-pulse 2s ease-in-out' : undefined
                  }}
                >
                  <td>
                    <div className="employee-info">
                      <div className="avatar" style={{
                        backgroundImage: emp.photoUrl ? `url(http://localhost:3001${emp.photoUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: emp.photoUrl ? 'transparent' : undefined
                      }}>
                        {!emp.photoUrl && emp.lastName[0]}
                      </div>
                      <div className="employee-details">
                        <div className="employee-name">{emp.lastName} {emp.firstName}</div>
                        <div className="employee-email">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{emp.department.name}</td>
                  <td>{emp.position.name}</td>
                  <td>{emp.area?.name || '未設定'}</td>
                  <td><EmploymentTypeBadge type={emp.employmentType} /></td>
                  <td>{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('ja-JP') : '未設定'}</td>
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

                {/* エリア */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    エリア
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
                    value={formData.areaId}
                    onChange={e => handleInputChange('areaId', e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="">エリアを選択してください（任意）</option>
                    {Array.isArray(areas) && areas.length > 0 ? (
                      areas.map(area => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))
                    ) : (
                      <option disabled>エリア情報を読み込み中...</option>
                    )}
                  </select>
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

                {/* 姓（カナ） */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>姓（カナ）</label>
                  <input
                    type="text"
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
                    value={formData.lastNameKana}
                    onChange={e => handleInputChange('lastNameKana', e.target.value)}
                    placeholder="タナカ"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* 名（カナ） */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>名（カナ）</label>
                  <input
                    type="text"
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
                    value={formData.firstNameKana}
                    onChange={e => handleInputChange('firstNameKana', e.target.value)}
                    placeholder="タロウ"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* 生年月日 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>生年月日</label>
                  <input
                    type="date"
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
                    value={formData.birthDate}
                    onChange={e => handleInputChange('birthDate', e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* 写真ファイル */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>写真</label>
                  
                  {/* ファイル選択 */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
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
                  />
                  
                  {/* ファイル情報とプレビュー */}
                  {(selectedPhoto || photoPreview) && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: '#f9fafb'
                    }}>
                      {selectedPhoto && (
                        <p style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          margin: '0 0 8px 0'
                        }}>
                          選択されたファイル: {selectedPhoto.name} ({(selectedPhoto.size / 1024 / 1024).toFixed(2)}MB)
                        </p>
                      )}
                      
                      {photoPreview && (
                        <div style={{ textAlign: 'center' }}>
                          <img
                            src={photoPreview}
                            alt="プレビュー"
                            style={{
                              maxWidth: '150px',
                              maxHeight: '150px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              marginBottom: '8px'
                            }}
                          />
                          <div>
                            <button
                              type="button"
                              onClick={handlePhotoDelete}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #dc2626',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                color: '#dc2626',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = '#fef2f2'}
                              onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = 'white'}
                            >
                              🗑️ 写真を削除
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {isPhotoUploading && (
                        <p style={{
                          fontSize: '12px',
                          color: '#3b82f6',
                          margin: '8px 0 0 0'
                        }}>
                          📤 アップロード中...
                        </p>
                      )}
                    </div>
                  )}
                  
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: '4px 0 0 0'
                  }}>
                    JPG、PNG、GIF形式で5MB以下のファイルを選択してください
                  </p>
                </div>

                {/* 住所 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>住所</label>
                  <input
                    type="text"
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
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="東京都新宿区..."
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* 緊急連絡先 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>緊急連絡先</label>
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
                      minHeight: '60px',
                      resize: 'vertical'
                    }}
                    value={formData.emergencyContact}
                    onChange={e => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="名前: 田中花子（配偶者）&#10;電話: 090-1234-5678"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* 学歴 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>学歴</label>
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
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    value={formData.education}
                    onChange={e => handleInputChange('education', e.target.value)}
                    placeholder="2018年3月 ○○大学 経済学部 卒業"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* 職歴 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>職歴</label>
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
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    value={formData.workHistory}
                    onChange={e => handleInputChange('workHistory', e.target.value)}
                    placeholder="2018年4月 ○○会社 営業部 入社&#10;2020年4月 △△会社 営業部 転職"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* スキル */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>スキル・資格</label>
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
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    value={formData.skills}
                    onChange={e => handleInputChange('skills', e.target.value)}
                    placeholder="・英語検定2級&#10;・MOS Excel Expert&#10;・営業経験5年"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* 備考 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>備考</label>
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
                      minHeight: '60px',
                      resize: 'vertical'
                    }}
                    value={formData.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    placeholder="その他特記事項"
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
                    color: deletingEmployee.photoUrl ? 'transparent' : '#6b7280',
                    backgroundImage: deletingEmployee.photoUrl ? `url(http://localhost:3001${deletingEmployee.photoUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    {!deletingEmployee.photoUrl && deletingEmployee.lastName[0]}
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
                  color: detailEmployee.photoUrl ? 'transparent' : '#6b7280',
                  backgroundImage: detailEmployee.photoUrl ? `url(http://localhost:3001${detailEmployee.photoUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: detailEmployee.photoUrl ? '2px solid #e5e7eb' : 'none'
                }}>
                  {!detailEmployee.photoUrl && detailEmployee.lastName[0]}
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
                      }}>フリガナ</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0'
                      }}>
                        {detailEmployee.lastNameKana && detailEmployee.firstNameKana 
                          ? `${detailEmployee.lastNameKana} ${detailEmployee.firstNameKana}` 
                          : '未登録'}
                      </p>
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
                      }}>生年月日</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0'
                      }}>{detailEmployee.birthDate ? new Date(detailEmployee.birthDate).toLocaleDateString('ja-JP') : '未登録'}</p>
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
                      }}>エリア</label>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0,
                        padding: '8px 0'
                      }}>{detailEmployee.area?.name || '未設定'}</p>
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
                      }}>{detailEmployee.hireDate ? new Date(detailEmployee.hireDate).toLocaleDateString('ja-JP') : '未設定'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 追加情報セクション */}
              {(detailEmployee.address || detailEmployee.emergencyContact || detailEmployee.education || detailEmployee.workHistory || detailEmployee.skills || detailEmployee.notes) && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 16px 0',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e5e7eb'
                  }}>追加情報</h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '16px'
                  }}>
                    {detailEmployee.address && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px'
                        }}>住所</label>
                        <p style={{
                          fontSize: '14px',
                          color: '#111827',
                          margin: 0,
                          padding: '8px 0',
                          lineHeight: 1.6
                        }}>{detailEmployee.address}</p>
                      </div>
                    )}

                    {detailEmployee.emergencyContact && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px'
                        }}>緊急連絡先</label>
                        <p style={{
                          fontSize: '14px',
                          color: '#111827',
                          margin: 0,
                          padding: '8px 0',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line'
                        }}>{detailEmployee.emergencyContact}</p>
                      </div>
                    )}

                    {detailEmployee.education && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px'
                        }}>学歴</label>
                        <p style={{
                          fontSize: '14px',
                          color: '#111827',
                          margin: 0,
                          padding: '8px 0',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line'
                        }}>{detailEmployee.education}</p>
                      </div>
                    )}

                    {detailEmployee.workHistory && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px'
                        }}>職歴</label>
                        <p style={{
                          fontSize: '14px',
                          color: '#111827',
                          margin: 0,
                          padding: '8px 0',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line'
                        }}>{detailEmployee.workHistory}</p>
                      </div>
                    )}

                    {detailEmployee.skills && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px'
                        }}>スキル・資格</label>
                        <p style={{
                          fontSize: '14px',
                          color: '#111827',
                          margin: 0,
                          padding: '8px 0',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line'
                        }}>{detailEmployee.skills}</p>
                      </div>
                    )}

                    {detailEmployee.notes && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px'
                        }}>備考</label>
                        <p style={{
                          fontSize: '14px',
                          color: '#111827',
                          margin: 0,
                          padding: '8px 0',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line'
                        }}>{detailEmployee.notes}</p>
                      </div>
                    )}

                    {detailEmployee.photoUrl && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px'
                        }}>写真</label>
                        <div style={{ 
                          padding: '8px 0',
                          textAlign: 'center'
                        }}>
                          <img 
                            src={`http://localhost:3001${detailEmployee.photoUrl}`}
                            alt={`${detailEmployee.lastName} ${detailEmployee.firstName}`}
                            style={{
                              maxWidth: '200px',
                              maxHeight: '200px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                            }}
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              // エラー時に代替テキストを表示
                              const errorMsg = document.createElement('div');
                              errorMsg.textContent = '写真を読み込めませんでした';
                              errorMsg.style.cssText = 'color: #9ca3af; font-size: 14px; padding: 20px; border: 1px dashed #d1d5db; border-radius: 8px; text-align: center;';
                              img.parentNode?.appendChild(errorMsg);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
      
      {/* 強調表示アニメーション用CSS */}
      <style>{`
        @keyframes highlight-pulse {
          0% { 
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
            transform: scale(1.02);
          }
          100% { 
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
            transform: scale(1);
          }
        }
      `}</style>
      
      {/* CSVインポートモーダル */}
      <EmployeeImportModal
        isOpen={isImportModalOpen}
        onClose={handleImportModalClose}
        onImportComplete={handleImportComplete}
      />
    </Layout>
  );
};

export default EmployeeListPage;