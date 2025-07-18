"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
// 環境変数読み込み
dotenv_1.default.config();
// ルーターインポート
const auth_1 = __importDefault(require("./routes/auth"));
const employees_1 = __importDefault(require("./routes/employees"));
const departments_1 = __importDefault(require("./routes/departments"));
const positions_1 = __importDefault(require("./routes/positions"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// ミドルウェア設定
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // フロントエンドのURL（複数対応）
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// OPTIONSリクエスト（preflight）の明示的処理
app.options('*', (0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ヘルスチェック
app.get('/', (req, res) => {
    res.json({
        message: '営業支援ツール統合システム API Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});
// API Routes
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/employees', employees_1.default);
app.use('/api/v1/departments', departments_1.default);
app.use('/api/v1/positions', positions_1.default);
// 404ハンドラー
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND_001',
            message: 'エンドポイントが見つかりません',
            path: req.originalUrl
        }
    });
});
// エラーハンドラー
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({
        success: false,
        error: Object.assign({ code: 'SERVER_001', message: 'サーバーエラーが発生しました' }, (process.env.NODE_ENV === 'development' && { details: error.message }))
    });
});
// サーバー起動
app.listen(PORT, () => {
    console.log('🚀 Server running on http://localhost:' + PORT);
    console.log('📋 Available endpoints:');
    console.log('   GET  /                     - Server info');
    console.log('   GET  /health               - Health check');
    console.log('   POST /api/v1/auth/login    - User login');
    console.log('   POST /api/v1/auth/refresh  - Token refresh');
    console.log('   GET  /api/v1/auth/me       - Current user info');
    console.log('   POST /api/v1/auth/logout   - User logout');
    console.log('   GET  /api/v1/employees     - Get employees');
    console.log('   GET  /api/v1/employees/:id - Get employee detail');
    console.log('   POST /api/v1/employees     - Create employee');
    console.log('   PUT  /api/v1/employees/:id - Update employee');
    console.log('   DELETE /api/v1/employees/:id - Delete employee');
    console.log('   GET  /api/v1/departments   - Get departments');
    console.log('   POST /api/v1/departments   - Create department');
    console.log('   GET  /api/v1/positions     - Get positions');
    console.log('   POST /api/v1/positions     - Create position');
    console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
}); // テストコメント
