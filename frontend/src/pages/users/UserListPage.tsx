import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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

const roles = [
  { value: 'ADMIN', label: '管理者' },
  { value: 'HR_MANAGER', label: '人事担当者' },
  { value: 'SALES_MANAGER', label: '営業管理者' },
  { value: 'EMPLOYEE', label: '一般社員' },
];

const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'EMPLOYEE',
    isActive: true,
    employeeId: '',
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setForm({ username: '', password: '', role: 'EMPLOYEE', isActive: true, employeeId: '' });
    setEditingUser(null);
    setIsModalOpen(true);
  };
  const openEditModal = (user: User) => {
    setModalMode('edit');
    setForm({
      username: user.username,
      password: '',
      role: user.role,
      isActive: user.isActive,
      employeeId: user.employee?.id || '',
    });
    setEditingUser(user);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  return (
    <Layout>
      <div className="content-header">
        <div>
          <h1 className="content-title">アカウント管理</h1>
          <p className="content-subtitle">システムアカウントの一覧・新規作成・編集を行います</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="add-btn" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={openCreateModal}>
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
                    onClick={e => { e.preventDefault(); openEditModal(u); }}
                  >
                    編集
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* モーダルフォーム */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', borderRadius: 12, width: '90%', maxWidth: 400, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>{modalMode === 'create' ? '新規アカウント作成' : 'アカウント編集'}</h2>
            <form>
              <div style={{ marginBottom: 16 }}>
                <Input label="ユーザー名" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <Input label="パスワード" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={modalMode === 'create'} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">権限</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
                <input id="isActive" type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ marginRight: 8 }} />
                <label htmlFor="isActive" style={{ fontSize: 15, color: '#374151', fontWeight: 500, userSelect: 'none' }}>有効</label>
              </div>
              <div style={{ marginBottom: 24 }}>
                <Input label="従業員ID" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} placeholder="従業員ID" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Button
                  type="button"
                  className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold text-base min-w-[100px]"
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); closeModal(); }}
                >キャンセル</Button>
                <Button
                  type="submit"
                  style={{
                    backgroundColor: '#4094F7',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '16px',
                    minWidth: '100px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.target as HTMLElement).style.backgroundColor = '#4094F7'}
                >{modalMode === 'create' ? '登録' : '更新'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserListPage; 