import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';    
import { useAuthContext } from './contexts/AuthContext';
import EmployeeListPage from './pages/employees/EmployeeListPage';
import DepartmentListPage from './pages/departments/DepartmentListPage';
import PositionListPage from './pages/positions/PositionListPage';
import AreaListPage from './pages/areas/AreaListPage';
import Layout from './components/layout/Layout';
import './App.css';
import UserListPage from './pages/users/UserListPage';

// ダッシュボードコンポーネント（更新版）
const DashboardPage: React.FC = () => {
  return (
    <Layout>
      <div className="content-header">
        <div>
          <h1 className="content-title">ダッシュボード</h1>
          <p className="content-subtitle">システムの概要と統計情報を表示します</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* 統計カード */}
        <div className="table-container p-4">
          <h3 className="text-sm font-medium text-gray-900">総社員数</h3>
          <p className="text-2xl font-bold text-blue-600">5</p>
        </div>
        <div className="table-container p-4">
          <h3 className="text-sm font-medium text-gray-900">部署数</h3>
          <p className="text-2xl font-bold text-green-600">5</p>
        </div>
        <div className="table-container p-4">
          <h3 className="text-sm font-medium text-gray-900">役職数</h3>
          <p className="text-2xl font-bold text-purple-600">8</p>
        </div>
        <div className="table-container p-4">
          <h3 className="text-sm font-medium text-gray-900">新規採用</h3>
          <p className="text-2xl font-bold text-yellow-600">3</p>
        </div>
      </div>
    </Layout>
  );
};



// プライベートルートコンポーネント
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();
  
  // ローディング中の場合
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>認証状態を確認中...</p>
      </div>
    );
  }
  
  // 認証済みの場合は子コンポーネントを表示、未認証の場合はログインページへリダイレクト
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// ログインページラッパー
const LoginWrapper: React.FC = () => {
  const { login } = useAuthContext();
  
  return (
    <LoginPage 
      onLogin={login}
      loading={false}
    />
  );
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuthContext();

  return (
    <Router>
      <Routes>
        {/* ログインページ */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginWrapper />
          } 
        />
        
        {/* 認証が必要なページ */}
        <Route 
          path="/dashboard" 
          element={<PrivateRoute><DashboardPage /></PrivateRoute>} 
        />
        <Route 
          path="/employees" 
          element={<PrivateRoute><EmployeeListPage /></PrivateRoute>} 
        />
        <Route 
          path="/departments" 
          element={<PrivateRoute><DepartmentListPage /></PrivateRoute>} 
        />
        <Route 
          path="/positions" 
          element={<PrivateRoute><PositionListPage /></PrivateRoute>} 
        />
        <Route 
          path="/areas" 
          element={<PrivateRoute><AreaListPage /></PrivateRoute>} 
        />
        <Route 
          path="/users" 
          element={<PrivateRoute><UserListPage /></PrivateRoute>} 
        />
        

        {/* デフォルトリダイレクト */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;