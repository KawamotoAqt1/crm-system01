import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { 
  authenticateToken, 
  requireHR, 
  requireAdmin,
  AuthenticatedRequest 
} from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// バリデーションスキーマ
const createAreaSchema = z.object({
  name: z.string().min(1, 'エリア名は必須です').max(100, 'エリア名は100文字以内です'),
  description: z.string().optional().transform(val => val || null),
});

const updateAreaSchema = createAreaSchema.partial();

const querySchema = z.object({
  page: z.string().regex(/^\d+$/, 'ページ番号は数値である必要があります').optional(),
  limit: z.string().regex(/^\d+$/, '件数は数値である必要があります').optional(),
  search: z.string().optional(),
});

// GET /areas - エリア一覧取得
router.get('/', async (req, res) => {
  try {
    const query = querySchema.parse(req.query);
    
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '50');
    const offset = (page - 1) * limit;
    
    // 検索条件構築
    const where: any = {
      deletedAt: null, // 論理削除されていないもの
    };
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    
    // データ取得
    const [areas, total] = await Promise.all([
      prisma.area.findMany({
        where,
        include: {
          _count: {
            select: { employees: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.area.count({ where }),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: areas,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
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
    
    console.error('Get areas error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// GET /areas/:id - エリア詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const area = await prisma.area.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { employees: true },
        },
        employees: {
          where: { deletedAt: null },
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: { name: true },
            },
            position: {
              select: { name: true },
            },
          },
          orderBy: { employeeId: 'asc' },
        },
      },
    });
    
    if (!area) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_001',
          message: 'エリアが見つかりません',
        },
      });
    }
    
    res.json({
      success: true,
      data: area,
    });
  } catch (error) {
    console.error('Get area detail error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// POST /areas - エリア新規作成
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validatedData = createAreaSchema.parse(req.body);
    
    // 重複チェック
    const existingArea = await prisma.area.findFirst({
      where: {
        name: validatedData.name,
        deletedAt: null,
      },
    });
    
    if (existingArea) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT_001',
          message: 'このエリア名は既に存在します',
        },
      });
    }
    
    const area = await prisma.area.create({
      data: validatedData,
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
    
    res.status(201).json({
      success: true,
      data: area,
      message: 'エリアを作成しました',
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
    
    console.error('Create area error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// PUT /areas/:id - エリア情報更新
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateAreaSchema.parse(req.body);
    
    // エリア存在確認
    const existingArea = await prisma.area.findFirst({
      where: { id, deletedAt: null },
    });
    
    if (!existingArea) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_001',
          message: 'エリアが見つかりません',
        },
      });
    }
    
    // 重複チェック（自分以外）
    if (validatedData.name) {
      const duplicateCheck = await prisma.area.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id },
          deletedAt: null,
        },
      });
      
      if (duplicateCheck) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT_001',
            message: 'このエリア名は既に存在します',
          },
        });
      }
    }
    
    const area = await prisma.area.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
    
    res.json({
      success: true,
      data: area,
      message: 'エリア情報を更新しました',
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
    
    console.error('Update area error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// DELETE /areas/:id - エリア削除
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // エリア存在確認
    const existingArea = await prisma.area.findFirst({
      where: { id, deletedAt: null },
    });
    
    if (!existingArea) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_001',
          message: 'エリアが見つかりません',
        },
      });
    }
    
    // このエリアに所属している社員がいるかチェック
    const employeesInArea = await prisma.employee.findMany({
      where: { 
        areaId: id,
        deletedAt: null 
      },
    });
    
    if (employeesInArea.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONSTRAINT_001',
          message: 'このエリアに所属している社員がいるため削除できません',
          details: {
            employeeCount: employeesInArea.length
          }
        },
      });
    }
    
    // 論理削除
    await prisma.area.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete area error:', error);
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