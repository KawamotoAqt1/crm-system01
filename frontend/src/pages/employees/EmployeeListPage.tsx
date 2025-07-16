import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';

// 型定義
interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department: {
    id: string;
    name: string;
  };
  position: {
    id: string;
    name: string;
  };
  employment_type: 'FULL_TIME' | 'CONTRACT' | 'PART_TIME' | 'INTERN';
  hire_date: string;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

const EMPLOYMENT_TYPE_CONFIG = {
  FULL_TIME: { label: '正社員', className: 'status-badge status-active' },
  CONTRACT: { label: '契約社員', className: 'status-badge status-pending' },
  PART_TIME: { label: 'パート', className: 'status-badge status-pending' },
  INTERN: { label: 'インターン', className: 'status-badge status-pending' }
};

const MOCK_DEPARTMENTS: Department[] = [
  { id: '1', name: '総務部' },
  { id: '2', name: '営業部' },
  { id: '3', name: '開発部' },
  { id: '4', name: '人事部' },
  { id: '5', name: '経理部' }
];

const MOCK_POSITIONS: Position[] = [
  { id: '1', name: '代表取締役' },
  { id: '2', name: '部長' },
  { id: '3', name: '課長' },
  { id: '4', name: '主任' },
  { id: '5', name: '一般' }
];

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    employee_id: 'EMP001',
    first_name: '太郎',
    last_name: '田中',
    email: 'tanaka@company.com',
    phone: '090-1234-5678',
    department: { id: '1', name: '総務部' },
    position: { id: '1', name: '代表取締役' },
    employment_type: 'FULL_TIME',
    hire_date: '2020-04-01',
    created_at: '2020-04-01T00:00:00Z',
    updated_at: '2020-04-01T00:00:00Z'
  },
  {
    id: '2',
    employee_id: 'EMP002',
    first_name: '花子',
    last_name: '佐藤',
    email: 'sato@company.com',
    phone: '090-2345-6789',
    department: { id: '2', name: '営業部' },
    position: { id: '2', name: '部長' },
    employment_type: 'FULL_TIME',
    hire_date: '2021-04-01',
    created_at: '2021-04-01T00:00:00Z',
    updated_at: '2021-04-01T00:00:00Z'
  },
  {
    id: '3',
    employee_id: 'EMP003',
    first_name: '次郎',
    last_name: '鈴木',
    email: 'suzuki@company.com',
    phone: '090-3456-7890',
    department: { id: '3', name: '開発部' },
    position: { id: '3', name: '課長' },
    employment_type: 'CONTRACT',
    hire_date: '2022-10-15',
    created_at: '2022-10-15T00:00:00Z',
    updated_at: '2022-10-15T00:00:00Z'
  },
  {
    id: '4',
    employee_id: 'EMP004',
    first_name: '美香',
    last_name: '高橋',
    email: 'takahashi@company.com',
    phone: '090-4567-8901',
    department: { id: '4', name: '人事部' },
    position: { id: '4', name: '主任' },
    employment_type: 'FULL_TIME',
    hire_date: '2023-01-15',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2023-01-15T00:00:00Z'
  },
  {
    id: '5',
    employee_id: 'EMP005',
    first_name: '健太',
    last_name: '山田',
    email: 'yamada@company.com',
    phone: '090-5678-9012',
    department: { id: '3', name: '開発部' },
    position: { id: '5', name: '一般' },
    employment_type: 'PART_TIME',
    hire_date: '2023-06-01',
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2023-06-01T00:00:00Z'
  }
];

const EmployeeListPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [departments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [positions] = useState<Position[]>(MOCK_POSITIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    setEmployees(MOCK_EMPLOYEES);
    setFilteredEmployees(MOCK_EMPLOYEES);
  }, []);

  useEffect(() => {
    let filtered = [...employees];
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.first_name.includes(searchTerm) ||
        emp.last_name.includes(searchTerm) ||
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
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  // UIコンポーネント
  const EmploymentTypeBadge: React.FC<{ type: Employee['employment_type'] }> = ({ type }) => {
    const config = EMPLOYMENT_TYPE_CONFIG[type];
    return <span className={config.className}>{config.label}</span>;
  };

  return (
    <Layout>
      <div className="content-header">
        <div>
          <h1 className="content-title">社員管理</h1>
          <p className="content-subtitle">社員情報の閲覧・編集・管理を行います</p>
        </div>
        <button className="add-btn">
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
          {departments.map(dep => (
            <option key={dep.id} value={dep.name}>{dep.name}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={selectedPosition}
          onChange={e => setSelectedPosition(e.target.value)}
        >
          <option value="">すべての役職</option>
          {positions.map(pos => (
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
            {currentEmployees.map(emp => (
              <tr key={emp.id}>
                <td>
                  <div className="employee-info">
                    <div className="avatar">{emp.last_name[0]}</div>
                    <div className="employee-details">
                      <div className="employee-name">{emp.last_name} {emp.first_name}</div>
                      <div className="employee-email">{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td>{emp.department.name}</td>
                <td>{emp.position.name}</td>
                <td><EmploymentTypeBadge type={emp.employment_type} /></td>
                <td>{emp.hire_date}</td>
                <td>
                  <div className="action-links">
                    <a href="#" className="action-link">詳細</a>
                    <a href="#" className="action-link edit">編集</a>
                    <a href="#" className="action-link delete">削除</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="pagination">
          <div className="pagination-info">
            {filteredEmployees.length === 0
              ? '0 件'
              : `${startIndex + 1} から ${Math.min(endIndex, filteredEmployees.length)} まで表示 (全 ${filteredEmployees.length} 件中)`}
          </div>
          <div className="pagination-controls">
            <button className="page-btn" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>前へ</button>
            {Array.from({ length: totalPages }, (_, i) => (
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
    </Layout>
  );
};

export default EmployeeListPage;