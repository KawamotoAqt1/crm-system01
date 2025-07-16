import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 簡易JWT実装（開発用）
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// JWTペイロード型定義
export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  employeeId: string;
  iat?: number;
  exp?: number;
}

// 認証済みリクエスト型定義
export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

// 簡易Base64エンコード/デコード
const encodeToken = (payload: any): string => {
  const data = JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24時間
  });
  return Buffer.from(data).toString('base64');
};

const decodeToken = (token: string): JWTPayload => {
  const data = Buffer.from(token, 'base64').toString('utf-8');
  const payload = JSON.parse(data);
  
  // 有効期限チェック
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  
  return payload;
};

// JWT認証ミドルウェア
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: '認証トークンが必要です',
        },
      });
      return;
    }

    // トークン検証
    const decoded = decodeToken(token);
    
    // ユーザー存在確認
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: 'ユーザーが見つからないか無効です',
        },
      });
      return;
    }

    // リクエストオブジェクトにユーザー情報を追加
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_003',
        message: '無効なトークンです',
      },
    });
  }
};

// 権限チェックミドルウェア
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: '認証が必要です',
        },
      });
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_004',
          message: 'この操作を実行する権限がありません',
        },
      });
      return;
    }

    next();
  };
};

// 管理者権限チェック
export const requireAdmin = requireRole([UserRole.ADMIN]);

// 人事権限チェック
export const requireHR = requireRole([UserRole.ADMIN, UserRole.HR_MANAGER]);

// 営業管理者権限チェック
export const requireSalesManager = requireRole([
  UserRole.ADMIN,
  UserRole.HR_MANAGER,
  UserRole.SALES_MANAGER,
]);

// トークン生成ユーティリティ
export const generateTokens = (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  const accessToken = encodeToken(payload);
  const refreshToken = encodeToken({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7日間
  });

  return {
    accessToken,
    refreshToken,
  };
};

// トークン検証ユーティリティ
export const verifyToken = (token: string): JWTPayload => {
  return decodeToken(token);
};

// パスワードハッシュ化ユーティリティ
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
