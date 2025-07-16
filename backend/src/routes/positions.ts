import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// バリデーションスキーマ
const createPositionSchema = z.object({
  name: z.string().min(1, '役職名は必須です'),
  level: z.number().int().min(1, 'レベルは1以上の整数である必要があります'),
  description: z.string().optional(),
});

// GET /positions - 役職一覧取得
router.get('/', authenticateToken, async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      orderBy: { level: 'asc' },
    });

    res.json({
      success: true,
      data: { positions },
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

// POST /positions - 役職作成
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, level, description } = createPositionSchema.parse(req.body);

    const position = await prisma.position.create({
      data: {
        name,
        level,
        description,
      },
    });

    res.status(201).json({
      success: true,
      data: { position },
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

export default router;