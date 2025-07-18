import React, { createContext, useContext, ReactNode, useReducer, useEffect, useCallback } from 'react';
import { User, LoginCredentials } from '../types';
import { authAPI } from '../services/api';

// 認証状態の型定義
interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// 認証アクションの型定義
type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH'; payload: { user: User } }
  | { type: 'SET_UNAUTH' }
  | { type: 'CLEAR_AUTH' };

// 認証コンテキストの型定義
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
}

// 認証状態のリデューサー
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_AUTH':
      return { 
        user: action.payload.user, 
        loading: false, 
        isAuthenticated: true 
      };
    case 'SET_UNAUTH':
      return { 
        user: null, 
        loading: false, 
        isAuthenticated: false 
      };
    case 'CLEAR_AUTH':
      return { 
        user: null, 
        loading: false, 
        isAuthenticated: false 
      };
    default:
      return state;
  }
};

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認証プロバイダーコンポーネント
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  // ローカルストレージをクリアする機能
  const clearAuth = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'CLEAR_AUTH' });
  }, []);

  // ログイン処理
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        dispatch({ type: 'SET_AUTH', payload: { user: response.data.user } });
        return { success: true };
      } else {
        dispatch({ type: 'SET_UNAUTH' });
        return { success: false, error: 'ログインに失敗しました' };
      }
    } catch (error) {
      dispatch({ type: 'SET_UNAUTH' });
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'ログイン中にエラーが発生しました';
        
      return { success: false, error: errorMessage };
    }
  }, []);

  // ログアウト処理
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  // トークンリフレッシュ
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        return false;
      }

      const response = await authAPI.refreshToken();
      
      if (response.success) {
        // 新しいトークンで現在のユーザー情報を取得
        const userResponse = await authAPI.getCurrentUser();
        if (userResponse.success) {
          dispatch({ type: 'SET_AUTH', payload: { user: userResponse.data.user } });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }, []);

  // 認証状態チェック
  const checkAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const accessToken = localStorage.getItem('accessToken');
      const refreshTokenValue = localStorage.getItem('refreshToken');
      
      // トークンが全くない場合は未認証として処理
      if (!accessToken && !refreshTokenValue) {
        dispatch({ type: 'SET_UNAUTH' });
        return;
      }

      // アクセストークンがあるが、リフレッシュトークンがない場合も未認証
      if (!refreshTokenValue) {
        dispatch({ type: 'SET_UNAUTH' });
        return;
      }

      // アクセストークンがない場合は、まずリフレッシュを試行
      if (!accessToken) {
        const refreshed = await refreshToken();
        if (!refreshed) {
          dispatch({ type: 'SET_UNAUTH' });
          return;
        }
        // リフレッシュ成功後、再帰的にcheckAuthを呼び出す
        await checkAuth();
        return;
      }

      // 現在のユーザー情報取得を試行
      try {
        const response = await authAPI.getCurrentUser();
        
        if (response.success) {
          dispatch({ type: 'SET_AUTH', payload: { user: response.data.user } });
          return;
        }
      } catch (error) {
        // 401エラーの場合はログ出力しない（正常な動作）
        if (error instanceof Error && !error.message.includes('認証が必要です')) {
          console.error('認証チェックエラー:', error);
        }
        
        // アクセストークンが無効な場合、リフレッシュを試行
        const refreshed = await refreshToken();
        
        if (!refreshed) {
          dispatch({ type: 'SET_UNAUTH' });
        }
        return;
      }
      
      dispatch({ type: 'SET_UNAUTH' });
    } catch (error) {
      console.error('認証チェック処理エラー:', error);
      dispatch({ type: 'SET_UNAUTH' });
    }
  }, [refreshToken]);

  // 初期化時に認証状態をチェック
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const authValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    checkAuth,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 認証フック（コンテキストを使用）
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}; 