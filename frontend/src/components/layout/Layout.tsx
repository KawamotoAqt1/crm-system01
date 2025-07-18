import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import '../../styles/employee-management.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthContext();

  const handleLogout = async () => {
    await logout();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/');
  };

  return (
    <div className="employee-management-page">
      {/* Header */}
      <div className="header">
        <div className="header-left">営業支援ツール統合システム</div>
        <div className="header-right">
          <span className="user-info">田中 太郎</span>
          <span className="admin-badge">管理者</span>
          <button onClick={handleLogout} className="logout-btn">ログアウト</button>
        </div>
      </div>
      
      <div className="main-container">
        {/* Sidebar */}
        <div className="sidebar">
          <button 
            onClick={() => handleNavigation('/dashboard')} 
            className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <i>📊</i>
            <span>ダッシュボード</span>
          </button>
          <button 
            onClick={() => handleNavigation('/employees')} 
            className={`sidebar-item ${isActive('/employees') ? 'active' : ''}`}
          >
            <i>👥</i>
            <span>社員管理</span>
          </button>
          <button 
            onClick={() => handleNavigation('/departments')} 
            className={`sidebar-item ${isActive('/departments') ? 'active' : ''}`}
          >
            <i>🏢</i>
            <span>部署管理</span>
          </button>
          <button 
            onClick={() => handleNavigation('/areas')} 
            className={`sidebar-item ${isActive('/areas') ? 'active' : ''}`}
          >
            <i>🗺️</i>
            <span>エリア管理</span>
          </button>
          <button 
            onClick={() => handleNavigation('/positions')} 
            className={`sidebar-item ${isActive('/positions') ? 'active' : ''}`}
          >
            <i>⚙️</i>
            <span>役職管理</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;