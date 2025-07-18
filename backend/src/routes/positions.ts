import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// バリデーションスキーマ
const createPositionSchema = z.object({
  name: z.string().min(1, '役職名は必須です'),
  level: z.number().int().min(1).max(10, 'レベルは1から10の間で設定してください'),
  description: z.string().optional(),
});

const updatePositionSchema = z.object({
  name: z.string().min(1, '役職名は必須です').optional(),
  level: z.number().int().min(1).max(10, 'レベルは1から10の間で設定してください').optional(),
  description: z.string().optional(),
});

// GET /positions - 役職一覧取得
router.get('/', authenticateToken, async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      where: { deletedAt: null },
      orderBy: { level: 'desc' },  // レベル降順で取得
    });

    res.json({
      success: true,
      data: positions,  // 直接配列を返す（フロントエンドと一致）
    });
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// GET /positions/:id - 個別役職取得
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const position = await prisma.position.findFirst({
      where: { 
        id,
        deletedAt: null 
      },
    });

    if (!position) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_001',
          message: '役職が見つかりません',
        },
      });
    }

    res.json({
      success: true,
      data: position,
    });
  } catch (error) {
    console.error('Get position error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// POST /positions - 役職作成
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, level, description } = createPositionSchema.parse(req.body);

    // 名前の重複チェック
    const existingPosition = await prisma.position.findFirst({
      where: { 
        name,
        deletedAt: null 
      },
    });

    if (existingPosition) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_001',
          message: 'この役職名は既に使用されています',
        },
      });
    }

    const position = await prisma.position.create({
      data: {
        name,
        level,
        description,
      },
    });

    res.status(201).json({
      success: true,
      data: position,
      message: '役職を作成しました',
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

    console.error('Create position error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// PUT /positions/:id - 役職更新
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updatePositionSchema.parse(req.body);

    // 役職が存在するかチェック
    const existingPosition = await prisma.position.findFirst({
      where: { 
        id,
        deletedAt: null 
      },
    });

    if (!existingPosition) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_001',
          message: '役職が見つかりません',
        },
      });
    }

    // 名前の重複チェック（自分以外）
    if (updateData.name) {
      const duplicatePosition = await prisma.position.findFirst({
        where: { 
          name: updateData.name,
          deletedAt: null,
          NOT: { id }
        },
      });

      if (duplicatePosition) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_001',
            message: 'この役職名は既に使用されています',
          },
        });
      }
    }

    const updatedPosition = await prisma.position.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: updatedPosition,
      message: '役職情報を更新しました',
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

    console.error('Update position error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// DELETE /positions/:id - 役職削除
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 役職が存在するかチェック
    const existingPosition = await prisma.position.findFirst({
      where: { 
        id,
        deletedAt: null 
      },
    });

    if (!existingPosition) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_001',
          message: '役職が見つかりません',
        },
      });
    }

    // この役職を使用している社員がいるかチェック
    const employeesWithPosition = await prisma.employee.findMany({
      where: { 
        positionId: id,
        deletedAt: null 
      },
    });

    if (employeesWithPosition.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONSTRAINT_001',
          message: 'この役職を使用している社員がいるため削除できません',
          details: {
            employeeCount: employeesWithPosition.length
          }
        },
      });
    }

    // ソフト削除を実行
    await prisma.position.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({
      success: true,
      message: '役職を削除しました',
    });
  } catch (error) {
    console.error('Delete position error:', error);
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