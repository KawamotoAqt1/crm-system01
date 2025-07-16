import { useEffect, useCallback, useReducer } from 'react';
import { User, LoginCredentials } from '../types';
import { authAPI } from '../services/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
  clearAuth: () => void; // ローカルストレージをクリアする機能を追加
}

interface UseAuthReturn extends AuthState, AuthActions {}

// 認証状態のリデューサー
const authReducer = (state: AuthState, action: any): AuthState => {
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

export const useAuth = (): UseAuthReturn => {
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
      
      if (!accessToken) {
        dispatch({ type: 'SET_UNAUTH' });
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
        // アクセストークンが無効な場合、リフレッシュを試行
        const refreshed = await refreshToken();
        
        if (!refreshed) {
          dispatch({ type: 'SET_UNAUTH' });
        }
        return;
      }
      
      dispatch({ type: 'SET_UNAUTH' });
    } catch (error) {
      dispatch({ type: 'SET_UNAUTH' });
    }
  }, [refreshToken]);

  // 初期化時に認証状態をチェック
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);



  // トークンの有効期限をチェック（オプション）
  useEffect(() => {
    if (!state.isAuthenticated) return;

    // 30分ごとにトークンをリフレッシュ
    const interval = setInterval(() => {
      refreshToken();
    }, 30 * 60 * 1000); // 30分

    return () => clearInterval(interval);
  }, [state.isAuthenticated, refreshToken]);

  return {
    ...state,
    login,
    logout,
    refreshToken,
    checkAuth,
    clearAuth, // 新しい機能を追加
  };
};