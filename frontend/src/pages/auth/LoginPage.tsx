import React, { useState } from 'react';
import { Button, Input } from '../../components/ui';
import { LoginCredentials } from '../../types';

interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, loading = false }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof LoginCredentials) => (value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // エラーをクリア
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!credentials.username.trim()) {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg 
              className="h-6 w-6 text-blue-600" 
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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            営業支援ツール統合システム
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントにログインしてください
          </p>
        </div>

        {/* ログインフォーム */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              name="username"
              label="ユーザー名"
              type="text"
              value={credentials.username}
              onChange={handleInputChange('username')}
              placeholder="ユーザー名を入力"
              required
              disabled={isSubmitting || loading}
            />

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
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-5 w-5 text-red-400" 
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
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* ログインボタン */}
          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || loading}
              loading={isSubmitting || loading}
            >
              ログイン
            </Button>
          </div>
        </form>

        {/* テストアカウント情報 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">テストアカウント</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>管理者:</strong> admin / password123</p>
            <p><strong>人事管理者:</strong> hr_manager / password123</p>
            <p><strong>営業管理者:</strong> sales_manager / password123</p>
            <p><strong>一般社員:</strong> employee1 / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};