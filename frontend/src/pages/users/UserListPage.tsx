import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';

interface User {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    role: 'ADMIN',
    isActive: true,
    employee: { id: 'e1', firstName: '太郎', lastName: '田中', email: 'tanaka@company.com' },
  },
  {
    id: '2',
    username: 'saburo2',
    role: 'HR_MANAGER',
    isActive: true,
    employee: { id: 'e2', firstName: '三郎', lastName: '山田', email: 'yamada@company.com' },
  },
];

const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // TODO: APIから取得
    setUsers(mockUsers);
  }, []);

  return (
    <Layout>
      <div className="content-header">
        <div>
          <h1 className="content-title">アカウント管理</h1>
          <p className="content-subtitle">システムアカウントの一覧・新規作成・編集を行います</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="add-btn" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>＋</span>
            <span>新規アカウント作成</span>
          </button>
        </div>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ユーザー名</th>
              <th>権限</th>
              <th>有効</th>
              <th>従業員名</th>
              <th>メール</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{u.isActive ? '○' : '×'}</td>
                <td>{u.employee ? `${u.employee.lastName} ${u.employee.firstName}` : '-'}</td>
                <td>{u.employee?.email || '-'}</td>
                <td>
                  <a
                    href="#"
                    className="action-link edit"
                    style={{ color: '#f59e42', textDecoration: 'underline', fontWeight: 500, cursor: 'pointer' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#d97706'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#f59e42'}
                  >
                    編集
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default UserListPage; 