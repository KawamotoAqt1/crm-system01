import { PrismaClient, EmploymentType, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 シードデータ投入開始...');

  // ========================================
  // エリアマスタデータ
  // ========================================
  console.log('📍 エリアマスタ作成中...');
  
  const areas = [
    { name: '大阪', description: '大阪エリア' },
    { name: '京都', description: '京都エリア' },
    { name: '名古屋', description: '名古屋エリア' },
    { name: '東京', description: '東京エリア' },
    { name: '神戸', description: '神戸エリア' },
    { name: '福岡', description: '福岡エリア' },
  ];

  const createdAreas = [];
  for (const areaData of areas) {
    const area = await prisma.area.upsert({
      where: { name: areaData.name },
      update: {},
      create: areaData,
    });
    createdAreas.push(area);
    console.log(`  ✅ エリア作成: ${area.name}`);
  }

  // ========================================
  // 部署マスタデータ
  // ========================================
  console.log('🏢 部署マスタ作成中...');
  
  const departments = [
    { name: '総務部', description: '人事・総務業務を担当' },
    { name: '営業部', description: '営業・販売業務を担当' },
    { name: '開発部', description: 'システム開発業務を担当' },
    { name: '経理部', description: '経理・財務業務を担当' },
    { name: 'マーケティング部', description: 'マーケティング業務を担当' },
  ];

  const createdDepartments = [];
  for (const deptData of departments) {
    const department = await prisma.department.upsert({
      where: { name: deptData.name },
      update: {},
      create: deptData,
    });
    createdDepartments.push(department);
    console.log(`  ✅ 部署作成: ${department.name}`);
  }

  // ========================================
  // 役職マスタデータ
  // ========================================
  console.log('👔 役職マスタ作成中...');
  
  const positions = [
    { name: '代表取締役', level: 10, description: '会社の最高責任者' },
    { name: '取締役', level: 9, description: '取締役' },
    { name: '部長', level: 8, description: '部門の責任者' },
    { name: '課長', level: 7, description: '課の責任者' },
    { name: '係長', level: 6, description: '係の責任者' },
    { name: '主任', level: 5, description: '主任' },
    { name: '一般職', level: 1, description: '一般職' },
  ];

  const createdPositions = [];
  for (const posData of positions) {
    const position = await prisma.position.upsert({
      where: { name: posData.name },
      update: {},
      create: posData,
    });
    createdPositions.push(position);
    console.log(`  ✅ 役職作成: ${position.name} (レベル: ${position.level})`);
  }

  // ========================================
  // 社員マスタデータ
  // ========================================
  console.log('👥 社員マスタ作成中...');
  
  const employees = [
    {
      employeeId: 'EMP001',
      firstName: '太郎',
      lastName: '田中',
      firstNameKana: 'タロウ',
      lastNameKana: 'タナカ',
      email: 'tanaka@company.com',
      phone: '090-1234-5678',
      departmentName: '総務部',
      positionName: '代表取締役',
      areaName: '東京',
      employmentType: EmploymentType.REGULAR,
      hireDate: new Date('2020-04-01'),
      birthDate: new Date('1980-01-15'),
      address: '東京都新宿区...',
    },
    {
      employeeId: 'EMP002',
      firstName: '花子',
      lastName: '佐藤',
      firstNameKana: 'ハナコ',
      lastNameKana: 'サトウ',
      email: 'sato@company.com',
      phone: '090-2345-6789',
      departmentName: '営業部',
      positionName: '部長',
      areaName: '大阪',
      employmentType: EmploymentType.REGULAR,
      hireDate: new Date('2021-04-01'),
      birthDate: new Date('1985-03-20'),
      address: '大阪府大阪市...',
    },
    {
      employeeId: 'EMP003',
      firstName: '一郎',
      lastName: '鈴木',
      firstNameKana: 'イチロウ',
      lastNameKana: 'スズキ',
      email: 'suzuki@company.com',
      phone: '090-3456-7890',
      departmentName: '開発部',
      positionName: '課長',
      areaName: '名古屋',
      employmentType: EmploymentType.REGULAR,
      hireDate: new Date('2022-07-01'),
      birthDate: new Date('1988-07-10'),
      address: '愛知県名古屋市...',
    },
    {
      employeeId: 'EMP004',
      firstName: '次郎',
      lastName: '田村',
      firstNameKana: 'ジロウ',
      lastNameKana: 'タムラ',
      email: 'tamura@company.com',
      phone: '090-4567-8901',
      departmentName: '営業部',
      positionName: '一般職',
      areaName: '福岡',
      employmentType: EmploymentType.REGULAR,
      hireDate: new Date('2023-04-01'),
      birthDate: new Date('1995-03-15'),
      address: '福岡県福岡市...',
    },
  ];

  const createdEmployees = [];
  for (const empData of employees) {
    const department = createdDepartments.find(d => d.name === empData.departmentName);
    const position = createdPositions.find(p => p.name === empData.positionName);
    const area = createdAreas.find(a => a.name === empData.areaName);

    if (!department || !position || !area) {
      console.error(`❌ 関連データが見つかりません: ${empData.employeeId}`);
      continue;
    }

    const employee = await prisma.employee.upsert({
      where: { employeeId: empData.employeeId },
      update: {},
      create: {
        employeeId: empData.employeeId,
        firstName: empData.firstName,
        lastName: empData.lastName,
        firstNameKana: empData.firstNameKana,
        lastNameKana: empData.lastNameKana,
        email: empData.email,
        phone: empData.phone,
        departmentId: department.id,
        positionId: position.id,
        areaId: area.id,
        employmentType: empData.employmentType,
        hireDate: empData.hireDate,
        birthDate: empData.birthDate,
        address: empData.address,
      },
    });
    createdEmployees.push(employee);
    console.log(`  ✅ 社員作成: ${employee.lastName} ${employee.firstName} (${empData.areaName})`);
  }

  // ========================================
  // ユーザーマスタデータ
  // ========================================
  console.log('🔐 ユーザーマスタ作成中...');
  
  const users = [
    {
      employeeId: createdEmployees[0].id, // 田中太郎
      username: 'admin',
      password: 'password123',
      role: UserRole.ADMIN,
    },
    {
      employeeId: createdEmployees[1].id, // 佐藤花子
      username: 'hr_manager',
      password: 'password123',
      role: UserRole.HR_MANAGER,
    },
    {
      employeeId: createdEmployees[2].id, // 鈴木一郎
      username: 'sales_manager',
      password: 'password123',
      role: UserRole.SALES_MANAGER,
    },
    {
      employeeId: createdEmployees[3].id, // 田村次郎
      username: 'employee1',
      password: 'password123',
      role: UserRole.EMPLOYEE,
    },
  ];

  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: {
        employeeId: userData.employeeId,
        username: userData.username,
        passwordHash: passwordHash,
        role: userData.role,
      },
    });
    console.log(`  ✅ ユーザー作成: ${user.username} (${user.role})`);
  }

  console.log('🎉 シードデータ投入完了！');
}

main()
  .catch((e) => {
    console.error('❌ シードデータ投入エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });