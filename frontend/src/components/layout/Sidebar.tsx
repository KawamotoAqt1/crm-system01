import React from 'react';
import { User, UserRole, SidebarItem } from '../../types';

interface SidebarProps {
  user: User | null;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, currentPath, onNavigate }) => {
  const sidebarItems: SidebarItem[] = [
    {
      key: 'dashboard',
      label: 'ダッシュボード',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
    },
    {
      key: 'employees',
      label: '社員管理',
      path: '/employees',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      key: 'departments',
      label: '部署管理',
      path: '/departments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      requiredRole: [UserRole.ADMIN, UserRole.HR_MANAGER],
    },
    {
      key: 'positions',
      label: '役職管理',
      path: '/positions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      requiredRole: [UserRole.ADMIN, UserRole.HR_MANAGER],
    },
  ];

  // ユーザーの権限チェック
  const hasPermission = (item: SidebarItem): boolean => {
    if (!item.requiredRole || !user) return true;
    return item.requiredRole.includes(user.role);
  };

  // アクティブ状態チェック
  const isActive = (path: string): boolean => {
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  return (
    <div style={{
      height: '100%',
      width: '100%',
      backgroundColor: '#1f2937',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <nav style={{
        flex: '1',
        padding: '24px 16px'
      }}>
        <ul style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          listStyle: 'none',
          margin: '0',
          padding: '0'
        }}>
          {sidebarItems.map((item) => {
            if (!hasPermission(item)) return null;

            const active = isActive(item.path);

            return (
              <li key={item.key} style={{ width: '100%' }}>
                <button
                  onClick={() => onNavigate(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '8px',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    // 確実な色指定
                    color: active ? '#ffffff' : '#d1d5db',
                    backgroundColor: active ? '#111827' : 'transparent',
                    boxShadow: active ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = '#374151';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#d1d5db';
                    }
                  }}
                >
                  <span style={{
                    marginRight: '12px',
                    flexShrink: '0',
                    width: '20px',
                    height: '20px',
                    color: active ? '#ffffff' : '#9ca3af'
                  }}>
                    {item.icon}
                  </span>
                  <span style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'inherit' // 親要素の色を継承
                  }}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};