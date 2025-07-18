import express from 'express';
import { z } from 'zod';
import { PrismaClient, EmploymentType } from '@prisma/client';
import { stringify } from 'csv-stringify/sync';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { 
  authenticateToken, 
  requireHR, 
  requireAdmin,
  AuthenticatedRequest 
} from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 全ルートにログを追加
router.use((req, res, next) => {
  console.log('📋 Employee Router:', req.method, req.path, req.url);
  console.log('📋 Employee Router Headers:', req.headers);
  next();
});

// バリデーションスキーマ
const createEmployeeSchema = z.object({
  employeeId: z.string().max(20, '社員IDは20文字以内です').optional(), // 新規登録時は自動生成するためoptional
  firstName: z.string().min(1, '名は必須です').max(50, '名は50文字以内です'),
  lastName: z.string().min(1, '姓は必須です').max(50, '姓は50文字以内です'),
  firstNameKana: z.string().max(100, 'フリガナ（名）は100文字以内です').nullish().transform(val => val || null),
  lastNameKana: z.string().max(100, 'フリガナ（姓）は100文字以内です').nullish().transform(val => val || null),
  email: z.string().email('有効なメールアドレスを入力してください').max(255),
  phone: z.string().max(20, '電話番号は20文字以内です').nullish().transform(val => val || null),
  departmentId: z.string().uuid('有効な部署IDを選択してください'),
  positionId: z.string().uuid('有効な役職IDを選択してください'),
  hireDate: z.string().refine((date) => !isNaN(Date.parse(date)), '有効な入社日を入力してください'),
  employmentType: z.nativeEnum(EmploymentType, '有効な雇用形態を選択してください'),
  birthDate: z.string().refine((date) => {
    if (!date || date.trim() === '') return true; // 空文字列は許可
    return !isNaN(Date.parse(date));
  }, '有効な生年月日を入力してください').nullish().transform(val => val || null),
  address: z.string().nullish().transform(val => val || null),
  emergencyContact: z.string().nullish().transform(val => val || null),
  education: z.string().nullish().transform(val => val || null),
  workHistory: z.string().nullish().transform(val => val || null),
  skills: z.string().nullish().transform(val => val || null),
  photoUrl: z.string().max(500, '写真URLは500文字以内です').refine((val) => {
    if (!val || val.trim() === '') return true; // 空文字列やnullは許可
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, '有効なURLを入力してください').nullish().transform(val => val || null),
  notes: z.string().nullish().transform(val => val || null),
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

// ========================================
// CSVインポート機能
// ========================================

// Multer設定（メモリストレージ使用）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB制限
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 ファイルフィルター実行:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      console.log('✅ ファイルフィルター通過');
      cb(null, true);
    } else {
      console.log('❌ ファイルフィルター拒否:', file.mimetype, file.originalname);
      cb(new Error('CSVファイルのみアップロード可能です'));
    }
  }
});

// CSVインポート用の型定義
interface ImportEmployeeData {
  社員ID?: string;
  姓: string;
  名: string;
  フリガナ姓: string;
  フリガナ名: string;
  部署: string;
  役職: string;
  雇用形態: string;
  入社日: string;
  メールアドレス: string;
  電話番号?: string;
  生年月日?: string;
  住所?: string;
}

// CSVデータのバリデーション
const validateEmployeeData = (data: ImportEmployeeData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 必須フィールドチェック
  if (!data.姓?.trim()) errors.push('姓は必須です');
  if (!data.名?.trim()) errors.push('名は必須です');
  if (!data.フリガナ姓?.trim()) errors.push('フリガナ姓は必須です');
  if (!data.フリガナ名?.trim()) errors.push('フリガナ名は必須です');
  if (!data.部署?.trim()) errors.push('部署は必須です');
  if (!data.役職?.trim()) errors.push('役職は必須です');
  if (!data.雇用形態?.trim()) errors.push('雇用形態は必須です');
  if (!data.入社日?.trim()) errors.push('入社日は必須です');
  if (!data.メールアドレス?.trim()) errors.push('メールアドレスは必須です');

  // メールアドレス形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.メールアドレス && !emailRegex.test(data.メールアドレス)) {
    errors.push('メールアドレスの形式が正しくありません');
  }

  // 日付形式チェック
  if (data.入社日) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.入社日)) {
      errors.push('入社日はYYYY-MM-DD形式で入力してください');
    } else {
      const date = new Date(data.入社日);
      if (isNaN(date.getTime())) {
        errors.push('入社日が正しい日付ではありません');
      }
    }
  }

  // 雇用形態チェック
  const validEmploymentTypes = ['正社員', '契約社員', '派遣', 'アルバイト'];
  if (data.雇用形態 && !validEmploymentTypes.includes(data.雇用形態)) {
    errors.push(`雇用形態は次のいずれかである必要があります: ${validEmploymentTypes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// CSVインポート実行 (一時的に認証を外してテスト)
router.post('/import/execute', upload.single('csvFile'), async (req, res) => {
  // ファイルにログを書き込み
  try {
    const logMessage = `🚀 CSVインポート処理開始 - ${new Date().toISOString()}\n`;
    fs.appendFileSync(path.join(__dirname, '../../debug.log'), logMessage);
    console.log('📝 ファイルログ書き込み成功');
  } catch (error) {
    console.error('❌ ファイルログ書き込みエラー:', error);
  }
  
  console.log('🚀 CSVインポート処理開始 - エンドポイント到達');
  console.log('🚀 CSVインポート処理開始 - エンドポイント到達 - 2回目');
  console.log('🚀 CSVインポート処理開始 - エンドポイント到達 - 3回目');
  console.log('📄 req.headers:', req.headers);
  console.log('📄 req.method:', req.method);
  console.log('📄 req.url:', req.url);
  console.log('📄 req.originalUrl:', req.originalUrl);
  console.log('📄 req.path:', req.path);
  
  try {
    console.log('🚀 CSVインポート処理開始 - try文開始');
    console.log('📄 req.file:', req.file);
    console.log('📄 req.body:', req.body);
    console.log('📄 req.body keys:', Object.keys(req.body || {}));
    console.log('📄 req.files:', req.files);
      
    if (!req.file) {
      console.log('❌ CSVファイルが選択されていません');
      return res.status(400).json({
        success: false,
        message: 'CSVファイルが選択されていません'
      });
    }
    
    console.log('📄 ファイル情報:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    // ファイル内容の確認
    const fileContent = req.file.buffer.toString('utf8');
    console.log('📄 ファイル内容（最初の500文字）:', fileContent.substring(0, 500));
    console.log('📄 ファイルサイズ（文字数）:', fileContent.length);
    
    // ファイルの各行を確認
    const lines = fileContent.split('\n');
    console.log('📄 ファイル行数:', lines.length);
    console.log('📄 各行の内容:');
    lines.forEach((line, index) => {
      console.log(`📄 行${index + 1}:`, line);
    });

    const results: any[] = [];
    const errors: any[] = [];
    let rowIndex = 0;
    let successCount = 0;

    // 既存の部署・役職を取得
    const departments = await prisma.department.findMany();
    const positions = await prisma.position.findMany();

    console.log('🏢 取得した部署:', departments.map(d => d.name));
    console.log('👔 取得した役職:', positions.map(p => p.name));

    const departmentMap = new Map(departments.map(d => [d.name, d.id]));
    const positionMap = new Map(positions.map(p => [p.name, p.id]));

    // CSVを解析してデータベースに保存
    const stream = Readable.from(req.file.buffer);
    
    console.log('📁 CSVファイル解析開始');
    
    const processPromise = new Promise<void>((resolve, reject) => {
      console.log('📁 CSVストリーム処理開始');
      
      let csvRowCount = 0;
      
      stream
        .pipe(csv({
          headers: ['社員ID', '姓', '名', 'フリガナ姓', 'フリガナ名', '部署', '役職', '雇用形態', '入社日', 'メールアドレス', '電話番号', '生年月日', '住所']
        }))
        .on('data', async (data: ImportEmployeeData) => {
          csvRowCount++;
          console.log(`📝 CSVパーサー行${csvRowCount}受信:`, data);
          console.log(`📝 CSVパーサー行${csvRowCount}のキー:`, Object.keys(data));
          
          // ヘッダー行をスキップ（値がカラム名と同じ場合）
          if (data.社員ID === '社員ID' || data.姓 === '姓') {
            console.log(`📝 ヘッダー行をスキップ:`, data);
            return;
          }
          
          rowIndex++;
          
          console.log(`📝 行${rowIndex}を処理中:`, data);
          console.log(`📝 行${rowIndex}のキー:`, Object.keys(data));
          
          try {
            // バリデーション
            const validation = validateEmployeeData(data);
            console.log(`✅ 行${rowIndex}バリデーション結果:`, validation);
            
            if (!validation.valid) {
              errors.push({
                row: rowIndex,
                message: validation.errors.join(', '),
                data: data
              });
              return;
            }

            // 部署・役職の存在チェック
            const departmentId = departmentMap.get(data.部署);
            const positionId = positionMap.get(data.役職);

            if (!departmentId) {
              errors.push({
                row: rowIndex,
                message: `部署「${data.部署}」が存在しません`,
                data: data
              });
              return;
            }

            if (!positionId) {
              errors.push({
                row: rowIndex,
                message: `役職「${data.役職}」が存在しません`,
                data: data
              });
              return;
            }

            // 既存社員の重複チェック（社員IDとメールアドレス）- 削除済みデータは除外
            console.log(`🔍 行${rowIndex}重複チェック開始:`, { 社員ID: data.社員ID, メールアドレス: data.メールアドレス });
            
            // 社員IDの重複チェック（削除済みデータは除外）
            if (data.社員ID) {
              console.log(`🔍 行${rowIndex}社員ID重複チェック開始:`, data.社員ID);
              
              const existingEmployeeById = await prisma.employee.findFirst({
                where: { 
                  employeeId: data.社員ID,
                  deletedAt: null  // 削除済みデータは除外
                }
              });

              console.log(`🔍 行${rowIndex}社員ID重複チェック結果:`, existingEmployeeById);
              
              // 削除済みレコードも含めて確認
              const allEmployeesWithId = await prisma.employee.findMany({
                where: { 
                  employeeId: data.社員ID
                }
              });
              console.log(`🔍 行${rowIndex}社員ID全レコード（削除済み含む）:`, allEmployeesWithId);

              if (existingEmployeeById) {
                console.log(`❌ 行${rowIndex}社員ID重複:`, data.社員ID);
                errors.push({
                  row: rowIndex,
                  message: `社員ID「${data.社員ID}」は既に登録されています`,
                  data: data
                });
                return;
              }
            }

            // メールアドレスの重複チェック（削除済みデータは除外）
            console.log(`🔍 行${rowIndex}メールアドレス重複チェック開始:`, data.メールアドレス);
            
            const existingEmployeeByEmail = await prisma.employee.findFirst({
              where: { 
                email: data.メールアドレス,
                deletedAt: null  // 削除済みデータは除外
              }
            });

            console.log(`🔍 行${rowIndex}メールアドレス重複チェック結果:`, existingEmployeeByEmail);
            
            // 削除済みレコードも含めて確認
            const allEmployeesWithEmail = await prisma.employee.findMany({
              where: { 
                email: data.メールアドレス
              }
            });
            console.log(`🔍 行${rowIndex}メールアドレス全レコード（削除済み含む）:`, allEmployeesWithEmail);

            if (existingEmployeeByEmail) {
              console.log(`❌ 行${rowIndex}メールアドレス重複:`, data.メールアドレス);
              errors.push({
                row: rowIndex,
                message: `メールアドレス「${data.メールアドレス}」は既に登録されています`,
                data: data
              });
              return;
            }

            // 雇用形態のマッピング
            const employmentTypeMap: { [key: string]: EmploymentType } = {
              '正社員': EmploymentType.REGULAR,
              '契約社員': EmploymentType.CONTRACT,
              '派遣': EmploymentType.TEMPORARY,
              'アルバイト': EmploymentType.PART_TIME
            };

            // 社員IDの自動生成（空の場合）
            const employeeId = data.社員ID || `EMP${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${rowIndex}`;
            
            // 社員データ作成
            console.log(`💾 行${rowIndex}データベース保存開始:`, employeeId);
            const employee = await prisma.employee.create({
              data: {
                employeeId: employeeId,
                firstName: data.名,
                lastName: data.姓,
                firstNameKana: data.フリガナ名,
                lastNameKana: data.フリガナ姓,
                email: data.メールアドレス,
                departmentId: departmentId,
                positionId: positionId,
                employmentType: employmentTypeMap[data.雇用形態],
                hireDate: new Date(data.入社日),
                phone: data.電話番号,
                birthDate: data.生年月日 ? new Date(data.生年月日) : null,
                address: data.住所
              },
              include: {
                department: true,
                position: true
              }
            });

            console.log(`✅ 行${rowIndex}データベース保存成功:`, employee.employeeId);
            results.push(employee);
            successCount++;

          } catch (error) {
            console.error(`行${rowIndex}の処理エラー:`, error);
            errors.push({
              row: rowIndex,
              message: 'データベース保存時にエラーが発生しました',
              data: data
            });
          }
        })
        .on('end', () => {
          console.log('📁 CSVファイル解析完了');
          console.log(`📊 処理結果: 行数=${rowIndex}, 成功=${successCount}, エラー=${errors.length}`);
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ CSVファイル解析エラー:', error);
          reject(error);
        });
    });

    await processPromise;

    console.log('📤 レスポンス送信開始');
    console.log('📊 最終結果:', {
      totalRows: rowIndex,
      successCount: successCount,
      errorCount: errors.length,
      importedEmployees: results.length,
      errors: errors.length
    });
    
    const responseData = {
      success: true,
      result: {
        totalRows: rowIndex,
        successCount: successCount,
        errorCount: errors.length,
        importedEmployees: results,
        errors: errors
      }
    };
    
    console.log('📤 レスポンス送信開始');
    console.log('📤 レスポンスデータ:', JSON.stringify(responseData, null, 2));
    
    // ファイルにもレスポンス情報を記録
    try {
      const responseLog = `📤 レスポンス送信 - ${new Date().toISOString()} - ${JSON.stringify(responseData)}\n`;
      fs.appendFileSync(path.join(__dirname, '../../debug.log'), responseLog);
    } catch (error) {
      console.error('❌ レスポンスログ書き込みエラー:', error);
    }
    
    res.json(responseData);
    
    console.log('📤 レスポンス送信完了');

  } catch (error: any) {
    console.error('❌ CSVインポートエラー:', error);
    console.error('❌ エラースタック:', error.stack);
    
    const errorResponse = {
      success: false,
      message: 'インポート処理に失敗しました',
      error: error.message
    };
    
    console.log('📤 エラーレスポンス送信:', JSON.stringify(errorResponse, null, 2));
    res.status(500).json(errorResponse);
  }
});

// GET /employees - 社員一覧取得 (一時的に認証を外してテスト)
router.get('/', async (req, res) => {
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

// GET /employees/:id - 社員詳細取得 (一時的に認証を外してテスト)
router.get('/:id', async (req, res) => {
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

// POST /employees - 社員新規登録 (一時的に認証を外してテスト)
router.post('/', async (req, res) => {
  try {
    const validatedData = createEmployeeSchema.parse(req.body);
    
        // 社員IDの自動生成（空の場合）- 20文字以内に制限
    const employeeId = validatedData.employeeId || `EMP${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4)}`;

    // 重複チェック
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId: employeeId },
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
        employeeId: employeeId,
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

// PUT /employees/:id - 社員情報更新 (一時的に認証を外してテスト)
router.put('/:id', async (req, res) => {
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
      const duplicateCheck = await prisma.employee.findFirst({
        where: {
          OR: [
            ...(validatedData.employeeId ? [{ employeeId: validatedData.employeeId }] : []),
            ...(validatedData.email ? [{ email: validatedData.email }] : []),
          ],
          id: { not: id },
          deletedAt: null,
        },
      });
      
      if (duplicateCheck) {
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
    if (validatedData.departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: validatedData.departmentId, deletedAt: null },
      });
      
      if (!department) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALID_002',
            message: '指定された部署が見つかりません',
          },
        });
      }
    }
    
    if (validatedData.positionId) {
      const position = await prisma.position.findFirst({
        where: { id: validatedData.positionId, deletedAt: null },
      });
      
      if (!position) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALID_003',
            message: '指定された役職が見つかりません',
          },
        });
      }
    }
    
    // 社員データ更新
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.hireDate && { hireDate: new Date(validatedData.hireDate) }),
        ...(validatedData.birthDate && { birthDate: new Date(validatedData.birthDate) }),
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
    
    res.json({
      success: true,
      data: updatedEmployee,
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

// DELETE /employees/:id - 社員削除 (一時的に認証を外してテスト)
router.delete('/:id', async (req, res) => {
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
    
    // 論理削除
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

// GET /employees/export/csv - 社員データCSVエクスポート
router.get('/export/csv', async (req, res) => {
  try {
    const query = querySchema.parse(req.query);
    
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
    
    // データ取得（全件取得）
    const employees = await prisma.employee.findMany({
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
    });
    
    // 雇用形態のマッピング（日本語用）
    const employmentTypeMap = {
      'REGULAR': '正社員',
      'CONTRACT': '契約社員', 
      'TEMPORARY': '派遣',
      'PART_TIME': 'アルバイト'
    };
    
    // CSVデータ作成
    const csvData = employees.map(employee => ({
      '社員ID': employee.employeeId,
      '姓': employee.lastName,
      '名': employee.firstName,
      'フリガナ姓': employee.lastNameKana || '',
      'フリガナ名': employee.firstNameKana || '',
      '部署': employee.department.name,
      '役職': employee.position.name,
      '雇用形態': employmentTypeMap[employee.employmentType as keyof typeof employmentTypeMap],
      '入社日': employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
      'メールアドレス': employee.email,
      '電話番号': employee.phone || '',
      '生年月日': employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : '',
      '住所': employee.address || '',
      '緊急連絡先': employee.emergencyContact || '',
      '学歴': employee.education || '',
      '職歴': employee.workHistory || '',
      'スキル': employee.skills || '',
      '写真URL': employee.photoUrl || '',
      '備考': employee.notes || ''
    }));
    
    // CSV文字列に変換
    const csvString = stringify(csvData, {
      header: true,
      columns: [
        '社員ID', '姓', '名', 'フリガナ姓', 'フリガナ名', '部署', '役職', '雇用形態', 
        '入社日', 'メールアドレス', '電話番号', '生年月日', '住所', '緊急連絡先',
        '学歴', '職歴', 'スキル', '写真URL', '備考'
      ],
      quoted_string: true,
      quoted_empty: false
    });
    
    // ファイル名作成（日付付き）
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `employees_${timestamp}.csv`;
    
    // レスポンスヘッダー設定
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // BOM付きで送信（Excel対応）
    const bom = '\uFEFF';
    res.send(bom + csvString);
    
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_001',
        message: 'CSVエクスポートに失敗しました',
      },
    });
  }
});

export default router; 