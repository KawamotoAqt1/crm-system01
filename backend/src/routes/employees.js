"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// バリデーションスキーマ
const createEmployeeSchema = zod_1.z.object({
    employeeId: zod_1.z.string().min(1, '社員IDは必須です').max(20, '社員IDは20文字以内です'),
    firstName: zod_1.z.string().min(1, '名は必須です').max(50, '名は50文字以内です'),
    lastName: zod_1.z.string().min(1, '姓は必須です').max(50, '姓は50文字以内です'),
    firstNameKana: zod_1.z.string().max(100, 'フリガナ（名）は100文字以内です').optional(),
    lastNameKana: zod_1.z.string().max(100, 'フリガナ（姓）は100文字以内です').optional(),
    email: zod_1.z.string().email('有効なメールアドレスを入力してください').max(255),
    phone: zod_1.z.string().max(20, '電話番号は20文字以内です').optional(),
    departmentId: zod_1.z.string().uuid('有効な部署IDを選択してください'),
    positionId: zod_1.z.string().uuid('有効な役職IDを選択してください'),
    hireDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), '有効な入社日を入力してください'),
    employmentType: zod_1.z.nativeEnum(client_1.EmploymentType, '有効な雇用形態を選択してください'),
    birthDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), '有効な生年月日を入力してください').optional(),
    address: zod_1.z.string().optional(),
    emergencyContact: zod_1.z.string().optional(),
    education: zod_1.z.string().optional(),
    workHistory: zod_1.z.string().optional(),
    skills: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const updateEmployeeSchema = createEmployeeSchema.partial();
const querySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/, 'ページ番号は数値である必要があります').optional(),
    limit: zod_1.z.string().regex(/^\d+$/, '件数は数値である必要があります').optional(),
    search: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().uuid().optional(),
    positionId: zod_1.z.string().uuid().optional(),
    employmentType: zod_1.z.nativeEnum(client_1.EmploymentType).optional(),
    sortBy: zod_1.z.enum(['firstName', 'lastName', 'hireDate', 'employeeId']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
// GET /employees - 社員一覧取得
router.get('/', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = querySchema.parse(req.query);
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '20');
        const offset = (page - 1) * limit;
        // 検索条件構築
        const where = {
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
        const orderBy = {};
        if (query.sortBy) {
            orderBy[query.sortBy] = query.sortOrder || 'asc';
        }
        else {
            orderBy.employeeId = 'asc'; // デフォルトソート
        }
        // データ取得
        const [employees, total] = yield Promise.all([
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
}));
// GET /employees/:id - 社員詳細取得
router.get('/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const employee = yield prisma.employee.findFirst({
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
    }
    catch (error) {
        console.error('Get employee detail error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_001',
                message: 'サーバーエラーが発生しました',
            },
        });
    }
}));
// POST /employees - 社員新規登録
router.post('/', auth_1.authenticateToken, auth_1.requireHR, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = createEmployeeSchema.parse(req.body);
        // 重複チェック
        const existingEmployee = yield prisma.employee.findFirst({
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
        const [department, position] = yield Promise.all([
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
        const employee = yield prisma.employee.create({
            data: Object.assign(Object.assign({}, validatedData), { hireDate: new Date(validatedData.hireDate), birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null }),
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
}));
// PUT /employees/:id - 社員情報更新
router.put('/:id', auth_1.authenticateToken, auth_1.requireHR, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const validatedData = updateEmployeeSchema.parse(req.body);
        // 社員存在確認
        const existingEmployee = yield prisma.employee.findFirst({
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
            const duplicateEmployee = yield prisma.employee.findFirst({
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
            const [department, position] = yield Promise.all([
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
        const updateData = Object.assign({}, validatedData);
        if (validatedData.hireDate) {
            updateData.hireDate = new Date(validatedData.hireDate);
        }
        if (validatedData.birthDate) {
            updateData.birthDate = new Date(validatedData.birthDate);
        }
        const employee = yield prisma.employee.update({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
}));
// DELETE /employees/:id - 社員削除（論理削除）
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // 社員存在確認
        const existingEmployee = yield prisma.employee.findFirst({
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
        yield prisma.employee.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_001',
                message: 'サーバーエラーが発生しました',
            },
        });
    }
}));
exports.default = router;
