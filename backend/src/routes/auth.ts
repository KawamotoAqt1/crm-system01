import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { 
  generateTokens, 
  verifyToken, 
  comparePassword,
  authenticateToken,
  AuthenticatedRequest 
} from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// バリデーションスキーマ
const loginSchema = z.object({
  username: z.string().min(1, 'ユーザー名は必須です'),
  password: z.string().min(1, 'パスワードは必須です'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'リフレッシュトークンは必須です'),
});

// POST /auth/login - ログイン
router.post('/login', async (req, res) => {
  try {
    // バリデーション
    const { username, password } = loginSchema.parse(req.body);

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { username },
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
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_005',
          message: 'ユーザー名またはパスワードが正しくありません',
        },
      });
    }

    // パスワード検証
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_005',
          message: 'ユーザー名またはパスワードが正しくありません',
        },
      });
    }

    // トークン生成
    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
    });

    // 最終ログイン日時更新
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          employee: {
            id: user.employee.id,
            employeeId: user.employee.employeeId,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            email: user.employee.email,
            department: {
              id: user.employee.department.id,
              name: user.employee.department.name,
            },
            position: {
              id: user.employee.position.id,
              name: user.employee.position.name,
              level: user.employee.position.level,
            },
          },
        },
        tokens,
      },
      message: 'ログインに成功しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALID_001',
          message: 'バリデーションエラー',
          details: error.issues,
        },
      });
    }

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// POST /auth/refresh - トークンリフレッシュ
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    // リフレッシュトークン検証
    const decoded = verifyToken(refreshToken);

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
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: 'ユーザーが見つからないか無効です',
        },
      });
    }

    // 新しいトークン生成
    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
    });

    res.json({
      success: true,
      data: { tokens },
      message: 'トークンを更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALID_001',
          message: 'バリデーションエラー',
          details: error.issues,
        },
      });
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_003',
        message: '無効なリフレッシュトークンです',
      },
    });
  }
});

// GET /auth/me - 現在のユーザー情報取得
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_001',
          message: 'ユーザーが見つかりません',
        },
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          employee: {
            id: user.employee.id,
            employeeId: user.employee.employeeId,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            email: user.employee.email,
            phone: user.employee.phone,
            department: {
              id: user.employee.department.id,
              name: user.employee.department.name,
            },
            position: {
              id: user.employee.position.id,
              name: user.employee.position.name,
              level: user.employee.position.level,
            },
            hireDate: user.employee.hireDate,
            employmentType: user.employee.employmentType,
          },
        },
      },
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// POST /auth/logout - ログアウト
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // 実際のアプリケーションでは、ここでトークンをブラックリストに追加したり
    // リフレッシュトークンを無効化したりする処理を行います
    // 今回はシンプルに成功レスポンスを返します

    res.json({
      success: true,
      message: 'ログアウトしました',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

export default router;