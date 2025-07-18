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
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🌱 データベースシード開始...');
        // 1. 部署データ作成
        console.log('📁 部署データを作成中...');
        const departments = yield Promise.all([
            prisma.department.create({
                data: {
                    name: '総務部',
                    description: '総務・人事・経理業務を担当',
                },
            }),
            prisma.department.create({
                data: {
                    name: '営業部',
                    description: '営業活動・顧客対応を担当',
                },
            }),
            prisma.department.create({
                data: {
                    name: '開発部',
                    description: 'システム開発・保守を担当',
                },
            }),
            prisma.department.create({
                data: {
                    name: '企画部',
                    description: '企画・マーケティングを担当',
                },
            }),
            prisma.department.create({
                data: {
                    name: '品質管理部',
                    description: '品質管理・テストを担当',
                },
            }),
        ]);
        console.log(`✅ ${departments.length}件の部署を作成しました`);
        // 2. 役職データ作成
        console.log('👑 役職データを作成中...');
        const positions = yield Promise.all([
            prisma.position.create({
                data: {
                    name: '代表取締役',
                    level: 10,
                    description: '会社の最高責任者',
                },
            }),
            prisma.position.create({
                data: {
                    name: '取締役',
                    level: 9,
                    description: '経営陣の一員',
                },
            }),
            prisma.position.create({
                data: {
                    name: '部長',
                    level: 8,
                    description: '部門の責任者',
                },
            }),
            prisma.position.create({
                data: {
                    name: '課長',
                    level: 7,
                    description: '課の責任者',
                },
            }),
            prisma.position.create({
                data: {
                    name: '主任',
                    level: 6,
                    description: 'チームリーダー',
                },
            }),
            prisma.position.create({
                data: {
                    name: '主席',
                    level: 5,
                    description: '専門職上級',
                },
            }),
            prisma.position.create({
                data: {
                    name: 'senior',
                    level: 4,
                    description: 'シニア職',
                },
            }),
            prisma.position.create({
                data: {
                    name: '一般職',
                    level: 1,
                    description: '一般職員',
                },
            }),
        ]);
        console.log(`✅ ${positions.length}件の役職を作成しました`);
        // 3. 社員データ作成
        console.log('👥 社員データを作成中...');
        const employees = yield Promise.all([
            // 代表取締役（管理者）
            prisma.employee.create({
                data: {
                    employeeId: 'EMP001',
                    firstName: '太郎',
                    lastName: '田中',
                    firstNameKana: 'タロウ',
                    lastNameKana: 'タナカ',
                    email: 'tanaka@company.com',
                    phone: '090-1234-5678',
                    departmentId: departments[0].id, // 総務部
                    positionId: positions[0].id, // 代表取締役
                    hireDate: new Date('2020-04-01'),
                    employmentType: client_1.EmploymentType.REGULAR,
                    birthDate: new Date('1975-05-15'),
                    address: '東京都渋谷区神南1-1-1',
                    emergencyContact: '田中花子 090-9876-5432',
                    education: '東京大学経済学部卒業',
                    workHistory: '前職：ABC商事（2015-2020）',
                    skills: '経営戦略、財務分析、リーダーシップ',
                    notes: '創業メンバー',
                },
            }),
            // 開発部部長
            prisma.employee.create({
                data: {
                    employeeId: 'EMP002',
                    firstName: '花子',
                    lastName: '佐藤',
                    firstNameKana: 'ハナコ',
                    lastNameKana: 'サトウ',
                    email: 'sato@company.com',
                    phone: '090-2345-6789',
                    departmentId: departments[2].id, // 開発部
                    positionId: positions[2].id, // 部長
                    hireDate: new Date('2021-01-15'),
                    employmentType: client_1.EmploymentType.REGULAR,
                    birthDate: new Date('1985-03-20'),
                    address: '東京都新宿区西新宿2-2-2',
                    emergencyContact: '佐藤一郎 090-8765-4321',
                    education: '早稲田大学理工学部卒業',
                    workHistory: 'Google Japan（2018-2021）',
                    skills: 'JavaScript, Python, Go, AWS, Docker',
                    notes: 'CTO候補',
                },
            }),
            // 営業部課長
            prisma.employee.create({
                data: {
                    employeeId: 'EMP003',
                    firstName: '一郎',
                    lastName: '鈴木',
                    firstNameKana: 'イチロウ',
                    lastNameKana: 'スズキ',
                    email: 'suzuki@company.com',
                    phone: '090-3456-7890',
                    departmentId: departments[1].id, // 営業部
                    positionId: positions[3].id, // 課長
                    hireDate: new Date('2022-07-01'),
                    employmentType: client_1.EmploymentType.REGULAR,
                    birthDate: new Date('1988-11-10'),
                    address: '東京都港区赤坂3-3-3',
                    emergencyContact: '鈴木美咲 090-7654-3210',
                    education: '慶応義塾大学商学部卒業',
                    workHistory: 'ソフトバンク（2020-2022）',
                    skills: '営業、プレゼンテーション、顧客管理',
                    notes: '営業成績トップ',
                },
            }),
            // 開発部主任
            prisma.employee.create({
                data: {
                    employeeId: 'EMP004',
                    firstName: '美咲',
                    lastName: '高橋',
                    firstNameKana: 'ミサキ',
                    lastNameKana: 'タカハシ',
                    email: 'takahashi@company.com',
                    phone: '090-4567-8901',
                    departmentId: departments[2].id, // 開発部
                    positionId: positions[4].id, // 主任
                    hireDate: new Date('2023-04-01'),
                    employmentType: client_1.EmploymentType.REGULAR,
                    birthDate: new Date('1992-07-25'),
                    address: '東京都品川区大崎4-4-4',
                    emergencyContact: '高橋雄一 090-6543-2109',
                    education: '東京工業大学情報工学科卒業',
                    workHistory: 'Mercari（2021-2023）',
                    skills: 'React, TypeScript, Node.js, PostgreSQL',
                    notes: 'フロントエンド専門',
                },
            }),
            // 営業部一般職
            prisma.employee.create({
                data: {
                    employeeId: 'EMP005',
                    firstName: '健太',
                    lastName: '山田',
                    firstNameKana: 'ケンタ',
                    lastNameKana: 'ヤマダ',
                    email: 'yamada@company.com',
                    phone: '090-5678-9012',
                    departmentId: departments[1].id, // 営業部
                    positionId: positions[7].id, // 一般職
                    hireDate: new Date('2024-04-01'),
                    employmentType: client_1.EmploymentType.REGULAR,
                    birthDate: new Date('1998-02-14'),
                    address: '東京都世田谷区三軒茶屋5-5-5',
                    emergencyContact: '山田由美 090-5432-1098',
                    education: '明治大学商学部卒業',
                    workHistory: '新卒入社',
                    skills: 'Excel, PowerPoint, 顧客対応',
                    notes: '新人研修中',
                },
            }),
        ]);
        console.log(`✅ ${employees.length}件の社員を作成しました`);
        // 4. ユーザーアカウント作成
        console.log('🔐 ユーザーアカウントを作成中...');
        const passwordHash = yield bcryptjs_1.default.hash('password123', 10);
        const users = yield Promise.all([
            // 管理者アカウント
            prisma.user.create({
                data: {
                    employeeId: employees[0].id,
                    username: 'admin',
                    passwordHash,
                    role: client_1.UserRole.ADMIN,
                    isActive: true,
                },
            }),
            // 人事管理者アカウント
            prisma.user.create({
                data: {
                    employeeId: employees[1].id,
                    username: 'hr_manager',
                    passwordHash,
                    role: client_1.UserRole.HR_MANAGER,
                    isActive: true,
                },
            }),
            // 営業管理者アカウント
            prisma.user.create({
                data: {
                    employeeId: employees[2].id,
                    username: 'sales_manager',
                    passwordHash,
                    role: client_1.UserRole.SALES_MANAGER,
                    isActive: true,
                },
            }),
            // 一般社員アカウント
            prisma.user.create({
                data: {
                    employeeId: employees[3].id,
                    username: 'employee1',
                    passwordHash,
                    role: client_1.UserRole.EMPLOYEE,
                    isActive: true,
                },
            }),
            prisma.user.create({
                data: {
                    employeeId: employees[4].id,
                    username: 'employee2',
                    passwordHash,
                    role: client_1.UserRole.EMPLOYEE,
                    isActive: true,
                },
            }),
        ]);
        console.log(`✅ ${users.length}件のユーザーアカウントを作成しました`);
        // 5. データ確認
        console.log('\n📊 作成されたデータの概要:');
        console.log(`- 部署: ${departments.length}件`);
        console.log(`- 役職: ${positions.length}件`);
        console.log(`- 社員: ${employees.length}件`);
        console.log(`- ユーザー: ${users.length}件`);
        console.log('\n🔑 テストアカウント情報:');
        console.log('管理者: username=admin, password=password123');
        console.log('人事管理者: username=hr_manager, password=password123');
        console.log('営業管理者: username=sales_manager, password=password123');
        console.log('一般社員1: username=employee1, password=password123');
        console.log('一般社員2: username=employee2, password=password123');
        console.log('\n🎉 データベースシード完了！');
    });
}
main()
    .catch((e) => {
    console.error('❌ シード実行エラー:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
