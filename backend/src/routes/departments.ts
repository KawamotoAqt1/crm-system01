// backend/src/routes/departments.ts - 拡張版
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 部署一覧取得（社員数カウント付き）
router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true }
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // レスポンス形式を統一
    const formattedDepartments = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      employeeCount: dept._count.employees,
      employees: dept.employees,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt
    }));

    res.json({
      success: true,
      data: formattedDepartments,
      message: 'Departments retrieved successfully'
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve departments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 特定部署取得（詳細情報付き）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true }
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...department,
        employeeCount: department._count.employees
      },
      message: 'Department retrieved successfully'
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve department',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 新規部署作成
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    // バリデーション
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    // 重複チェック
    const existingDepartment = await prisma.department.findFirst({
      where: { name: name.trim() }
    });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...department,
        employeeCount: department._count.employees
      },
      message: 'Department created successfully'
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 部署更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // バリデーション
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    // 存在チェック
    const existingDepartment = await prisma.department.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // 重複チェック（自分以外）
    const duplicateDepartment = await prisma.department.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (duplicateDepartment) {
      return res.status(409).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        ...department,
        employeeCount: department._count.employees
      },
      message: 'Department updated successfully'
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 部署削除（関連社員チェック付き）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // 強制削除フラグ

    // 存在チェック
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true }
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // 関連社員存在チェック
    if (department._count.employees > 0) {
      if (force !== 'true') {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete department with assigned employees',
          data: {
            employeeCount: department._count.employees,
            employees: department.employees
          }
        });
      }

      // 強制削除の場合、社員を削除（または別の対応）
      // 注意: 実際のシステムでは社員データを削除せず、別部署への移動を推奨
      await prisma.employee.deleteMany({
        where: { departmentId: id }
      });
    }

    await prisma.department.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `Department deleted successfully${force === 'true' ? ' (employees moved to unassigned)' : ''}`
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 部署統計取得
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    const overview = {
      totalDepartments: stats.length,
      totalEmployees: stats.reduce((sum, dept) => sum + dept._count.employees, 0),
      departmentStats: stats.map(dept => ({
        id: dept.id,
        name: dept.name,
        employeeCount: dept._count.employees
      })).sort((a, b) => b.employeeCount - a.employeeCount)
    };

    res.json({
      success: true,
      data: overview,
      message: 'Department statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve department statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;