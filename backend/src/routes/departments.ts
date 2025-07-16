import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { 
  authenticateToken, 
  requireHR, 
  requireAdmin 
} from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// バリデーションスキーマ
const createDepartmentSchema = z.object({
  name: z.string().min(1, '部署名は必須です').max(100, '部署名は100文字以内です'),
  description: z.string().max(500, '説明は500文字以内です').optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

// GET /departments - 部署一覧取得
router.get('/', authenticateToken, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            employees: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // 社員数を含む形式に変換
    const departmentsWithCount = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
      employeeCount: dept._count.employees,
    }));

    res.json({
      success: true,
      data: departmentsWithCount,
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// 他のCRUDメソッドは省略（必要に応じて後で追加）

export default router;