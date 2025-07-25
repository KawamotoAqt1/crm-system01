import express, { Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 管理者権限チェックミドルウェア
function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: { message: '管理者権限が必要です' } });
  }
  next();
}

// User新規登録用バリデーション
const createUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'EMPLOYEE']),
  employeeId: z.string().min(1),
});

// POST /users - 新規アカウント登録
router.post('/', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { username, password, role, employeeId } = createUserSchema.parse(req.body);

    // 既存ユーザー名チェック
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ success: false, error: { message: 'このユーザー名は既に使われています' } });
    }

    // Employee存在チェック
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return res.status(400).json({ success: false, error: { message: '従業員が存在しません' } });
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // User作成
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
        employeeId,
      },
    });

    res.status(201).json({ success: true, data: { user }, message: 'アカウントを作成しました' });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as any).message } });
  }
});

// User編集用バリデーション
const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'EMPLOYEE']).optional(),
  isActive: z.boolean().optional(),
});

// PUT /users/:id - アカウント編集
router.put('/:id', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = updateUserSchema.parse(req.body);

    // ユーザー存在チェック
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'ユーザーが見つかりません' } });
    }

    // username重複チェック（自分以外で同名がいないか）
    if (updateData.username && updateData.username !== user.username) {
      const exists = await prisma.user.findUnique({ where: { username: updateData.username } });
      if (exists) {
        return res.status(400).json({ success: false, error: { message: 'このユーザー名は既に使われています' } });
      }
    }

    // パスワード更新時はハッシュ化
    let updateFields: any = { ...updateData };
    if (updateData.password) {
      updateFields.passwordHash = await bcrypt.hash(updateData.password, 10);
      delete updateFields.password;
    }

    // 更新
    const updated = await prisma.user.update({
      where: { id },
      data: updateFields as any,
    });

    res.json({ success: true, data: { user: updated }, message: 'アカウントを更新しました' });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as any).message } });
  }
});

// GET /users - アカウント一覧取得
router.get('/', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        employee: true
      }
    });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as any).message } });
  }
});

export default router; 