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
exports.comparePassword = exports.hashPassword = exports.verifyToken = exports.generateTokens = exports.requireSalesManager = exports.requireHR = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// 簡易JWT実装（開発用）
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
// 簡易Base64エンコード/デコード
const encodeToken = (payload) => {
    const data = JSON.stringify(Object.assign(Object.assign({}, payload), { iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24時間
     }));
    return Buffer.from(data).toString('base64');
};
const decodeToken = (token) => {
    const data = Buffer.from(token, 'base64').toString('utf-8');
    const payload = JSON.parse(data);
    // 有効期限チェック
    if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
    }
    return payload;
};
// JWT認証ミドルウェア
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield prisma.user.findUnique({
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
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_003',
                message: '無効なトークンです',
            },
        });
    }
});
exports.authenticateToken = authenticateToken;
// 権限チェックミドルウェア
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const authReq = req;
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
exports.requireRole = requireRole;
// 管理者権限チェック
exports.requireAdmin = (0, exports.requireRole)([client_1.UserRole.ADMIN]);
// 人事権限チェック
exports.requireHR = (0, exports.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER]);
// 営業管理者権限チェック
exports.requireSalesManager = (0, exports.requireRole)([
    client_1.UserRole.ADMIN,
    client_1.UserRole.HR_MANAGER,
    client_1.UserRole.SALES_MANAGER,
]);
// トークン生成ユーティリティ
const generateTokens = (payload) => {
    const accessToken = encodeToken(payload);
    const refreshToken = encodeToken(Object.assign(Object.assign({}, payload), { exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7日間
     }));
    return {
        accessToken,
        refreshToken,
    };
};
exports.generateTokens = generateTokens;
// トークン検証ユーティリティ
const verifyToken = (token) => {
    return decodeToken(token);
};
exports.verifyToken = verifyToken;
// パスワードハッシュ化ユーティリティ
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const saltRounds = 10;
    return bcryptjs_1.default.hash(password, saltRounds);
});
exports.hashPassword = hashPassword;
const comparePassword = (password, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () {
    return bcryptjs_1.default.compare(password, hashedPassword);
});
exports.comparePassword = comparePassword;
