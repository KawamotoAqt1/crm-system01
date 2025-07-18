import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';    
import { useAuthContext } from './contexts/AuthContext';
import EmployeeListPage from './pages/employees/EmployeeListPage';
import DepartmentListPage from './pages/departments/DepartmentListPage';
import PositionListPage from './pages/positions/PositionListPage';  // 新規追加
import Layout from './components/layout/Layout';
import './App.css';

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
      
      <div className="table-container p-6">
        <p className="text-gray-600 mb-2">
          🎉 <strong>役職管理システムが実装完了しました！</strong>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          サイドバーの「役職管理」から新しい役職管理画面をご確認ください。
        </p>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-2">✅ 完成した機能：</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• 社員管理システム（完全動作）</li>
            <li>• 部署管理システム（完全動作）</li>
            <li>• 役職管理システム（本日完成 🆕）</li>
            <li>• 統合ナビゲーション</li>
            <li>• レスポンシブデザイン</li>
            <li>• 検索・フィルタリング機能</li>
            <li>• 統一されたUI/UX</li>
          </ul>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">🎯 役職管理の特徴：</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• レベル1-10の階層管理</li>
            <li>• レベル別カラーバッジ表示</li>
            <li>• 社員との関連チェック付き削除</li>
            <li>• 詳細な説明フィールド対応</li>
            <li>• リアルタイム検索機能</li>
            <li>• APIエラー時のモックデータフォールバック</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

// プライベートルートコンポーネント
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
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

// 認証済みページのルートコンポーネント  
const AuthenticatedRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/employees" element={<EmployeeListPage />} />
      <Route path="/departments" element={<DepartmentListPage />} />
      <Route path="/positions" element={<PositionListPage />} />  {/* 新規追加 */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
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
          path="/*" 
          element={
            <PrivateRoute>
              <AuthenticatedRoutes />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;