import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// 環境変数読み込み
dotenv.config();

// ルーターインポート
import authRouter from './routes/auth';
import employeeRouter from './routes/employees';
import departmentRouter from './routes/departments';
import positionRouter from './routes/positions';
import areaRouter from './routes/areas';

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア設定
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // フロントエンドのURL（複数対応）
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// OPTIONSリクエスト（preflight）の明示的処理
app.options('*', cors());

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静的ファイル配信（写真用）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/employees', employeeRouter);
app.use('/api/v1/departments', departmentRouter);
app.use('/api/v1/positions', positionRouter);
app.use('/api/v1/areas', areaRouter);



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
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_001',
      message: 'サーバーエラーが発生しました',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    }
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
  console.log('   GET  /api/v1/areas         - Get areas');
  console.log('   POST /api/v1/areas         - Create area');
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
});// テストコメント
