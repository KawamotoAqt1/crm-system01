import React, { useState } from 'react';
import { Button, Input } from '../../components/ui';
import { LoginCredentials } from '../../types';
import '../../styles/employee-management.css';

interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, loading = false }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof LoginCredentials) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // エラーをクリア
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!credentials.username?.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }
    
    if (!credentials.password.trim()) {
      setError('パスワードを入力してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await onLogin(credentials);
      
      if (!result.success) {
        setError(result.error || 'ログインに失敗しました');
      }
    } catch (err) {
      setError('ログイン中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="employee-management-page">
      {/* Header */}
      <div className="header">
        <div className="header-left">営業支援ツール統合システム</div>
        <div className="header-right">
          <span style={{ color: '#666', fontSize: '14px' }}>ログイン画面</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="login-container">
        <div className="login-form-wrapper">
          {/* ログインアイコン */}
          <div className="login-icon">
            <svg 
              className="icon" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
          
          <h2 className="login-title">アカウントログイン</h2>
          <p className="login-subtitle">システムにアクセスするためにログインしてください</p>

          {/* ログインフォーム */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <Input
                name="username"
                label="ユーザー名"
                type="text"
                value={credentials.username || ''}
                onChange={handleInputChange('username')}
                placeholder="ユーザー名を入力"
                required
                disabled={isSubmitting || loading}
              />
            </div>

            <div className="form-group">
              <Input
                name="password"
                label="パスワード"
                type="password"
                value={credentials.password}
                onChange={handleInputChange('password')}
                placeholder="パスワードを入力"
                required
                disabled={isSubmitting || loading}
              />
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="error-message">
                <div className="error-icon">
                  <svg 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                    />
                  </svg>
                </div>
                <p>{error}</p>
              </div>
            )}

            {/* ログインボタン */}
            <div className="form-group">
              <Button
                type="submit"
                className="login-button"
                disabled={isSubmitting || loading}
                loading={isSubmitting || loading}
              >
                ログイン
              </Button>
            </div>
          </form>

          {/* テストアカウント情報 */}
          <div className="test-accounts">
            <h3>テストアカウント</h3>
            <div className="test-account-list">
              <div className="test-account-item">
                <strong>管理者:</strong> admin / password123
              </div>
              <div className="test-account-item">
                <strong>人事管理者:</strong> hr_manager / password123
              </div>
              <div className="test-account-item">
                <strong>営業管理者:</strong> sales_manager / password123
              </div>
              <div className="test-account-item">
                <strong>一般社員:</strong> employee1 / password123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};