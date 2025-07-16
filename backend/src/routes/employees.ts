import express from 'express';
import { z } from 'zod';
import { PrismaClient, EmploymentType } from '@prisma/client';
import { 
  authenticateToken, 
  requireHR, 
  requireAdmin,
  AuthenticatedRequest 
} from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// バリデーションスキーマ
const createEmployeeSchema = z.object({
  employeeId: z.string().min(1, '社員IDは必須です').max(20, '社員IDは20文字以内です'),
  firstName: z.string().min(1, '名は必須です').max(50, '名は50文字以内です'),
  lastName: z.string().min(1, '姓は必須です').max(50, '姓は50文字以内です'),
  firstNameKana: z.string().max(100, 'フリガナ（名）は100文字以内です').optional(),
  lastNameKana: z.string().max(100, 'フリガナ（姓）は100文字以内です').optional(),
  email: z.string().email('有効なメールアドレスを入力してください').max(255),
  phone: z.string().max(20, '電話番号は20文字以内です').optional(),
  departmentId: z.string().uuid('有効な部署IDを選択してください'),
  positionId: z.string().uuid('有効な役職IDを選択してください'),
  hireDate: z.string().refine((date) => !isNaN(Date.parse(date)), '有効な入社日を入力してください'),
  employmentType: z.nativeEnum(EmploymentType, '有効な雇用形態を選択してください'),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), '有効な生年月日を入力してください').optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  education: z.string().optional(),
  workHistory: z.string().optional(),
  skills: z.string().optional(),
  notes: z.string().optional(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

const querySchema = z.object({
  page: z.string().regex(/^\d+$/, 'ページ番号は数値である必要があります').optional(),
  limit: z.string().regex(/^\d+$/, '件数は数値である必要があります').optional(),
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  sortBy: z.enum(['firstName', 'lastName', 'hireDate', 'employeeId']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// GET /employees - 社員一覧取得
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = querySchema.parse(req.query);
    
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const offset = (page - 1) * limit;
    
    // 検索条件構築
    const where: any = {
      deletedAt: null, // 論理削除されていないもの
    };
    
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeId: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }
    
    if (query.positionId) {
      where.positionId = query.positionId;
    }
    
    if (query.employmentType) {
      where.employmentType = query.employmentType;
    }
    
    // ソート条件
    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.employeeId = 'asc'; // デフォルトソート
    }
    
    // データ取得
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          position: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: employees,
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
    
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// GET /employees/:id - 社員詳細取得
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
            level: true,
            description: true,
          },
        },
      },
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_001',
          message: '社員が見つかりません',
        },
      });
    }
    
    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Get employee detail error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// POST /employees - 社員新規登録
router.post('/', authenticateToken, requireHR, async (req, res) => {
  try {
    const validatedData = createEmployeeSchema.parse(req.body);
    
    // 重複チェック
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId: validatedData.employeeId },
          { email: validatedData.email },
        ],
        deletedAt: null,
      },
    });
    
    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT_001',
          message: '社員IDまたはメールアドレスが既に存在します',
        },
      });
    }
    
    // 部署・役職の存在確認
    const [department, position] = await Promise.all([
      prisma.department.findFirst({
        where: { id: validatedData.departmentId, deletedAt: null },
      }),
      prisma.position.findFirst({
        where: { id: validatedData.positionId, deletedAt: null },
      }),
    ]);
    
    if (!department) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALID_002',
          message: '指定された部署が見つかりません',
        },
      });
    }
    
    if (!position) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALID_003',
          message: '指定された役職が見つかりません',
        },
      });
    }
    
    // 社員データ作成
    const employee = await prisma.employee.create({
      data: {
        ...validatedData,
        hireDate: new Date(validatedData.hireDate),
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });
    
    res.status(201).json({
      success: true,
      data: employee,
      message: '社員を登録しました',
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
    
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// PUT /employees/:id - 社員情報更新
router.put('/:id', authenticateToken, requireHR, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateEmployeeSchema.parse(req.body);
    
    // 社員存在確認
    const existingEmployee = await prisma.employee.findFirst({
      where: { id, deletedAt: null },
    });
    
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_001',
          message: '社員が見つかりません',
        },
      });
    }
    
    // 重複チェック（自分以外）
    if (validatedData.employeeId || validatedData.email) {
      const duplicateEmployee = await prisma.employee.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(validatedData.employeeId ? [{ employeeId: validatedData.employeeId }] : []),
                ...(validatedData.email ? [{ email: validatedData.email }] : []),
              ],
            },
            { deletedAt: null },
          ],
        },
      });
      
      if (duplicateEmployee) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT_001',
            message: '社員IDまたはメールアドレスが既に存在します',
          },
        });
      }
    }
    
    // 部署・役職の存在確認
    if (validatedData.departmentId || validatedData.positionId) {
      const [department, position] = await Promise.all([
        validatedData.departmentId 
          ? prisma.department.findFirst({
              where: { id: validatedData.departmentId, deletedAt: null },
            })
          : Promise.resolve(true),
        validatedData.positionId
          ? prisma.position.findFirst({
              where: { id: validatedData.positionId, deletedAt: null },
            })
          : Promise.resolve(true),
      ]);
      
      if (validatedData.departmentId && !department) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALID_002',
            message: '指定された部署が見つかりません',
          },
        });
      }
      
      if (validatedData.positionId && !position) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALID_003',
            message: '指定された役職が見つかりません',
          },
        });
      }
    }
    
    // データ更新
    const updateData: any = { ...validatedData };
    if (validatedData.hireDate) {
      updateData.hireDate = new Date(validatedData.hireDate);
    }
    if (validatedData.birthDate) {
      updateData.birthDate = new Date(validatedData.birthDate);
    }
    
    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });
    
    res.json({
      success: true,
      data: employee,
      message: '社員情報を更新しました',
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
    
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

// DELETE /employees/:id - 社員削除（論理削除）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 社員存在確認
    const existingEmployee = await prisma.employee.findFirst({
      where: { id, deletedAt: null },
    });
    
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_001',
          message: '社員が見つかりません',
        },
      });
    }
    
    // 論理削除実行
    await prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete employee error:', error);
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