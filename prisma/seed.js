const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with realistic expense tracker data...');

  // Clean existing data
  await prisma.expense.deleteMany();
  await prisma.recurringExpenseInstance.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.income.deleteMany();
  await prisma.salaryMonth.deleteMany();
  await prisma.category.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Default Admin & Regular User
  const adminHash = await bcrypt.hash('admin', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@expensetracker.local',
      name: 'Administrator',
      passwordHash: adminHash,
      role: 'ADMIN',
      currency: 'Rs.',
      timezone: 'Asia/Kathmandu',
      defaultSalary: 60000,
    },
  });
  console.log(`Created admin user: ${admin.username} (${admin.role})`);

  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      username: 'suyogya',
      email: 'suyogya@example.com',
      name: 'Suyogya',
      passwordHash,
      role: 'USER',
      currency: 'Rs.',
      timezone: 'Asia/Kathmandu',
      defaultSalary: 60000,
    },
  });
  console.log(`Created user: ${user.email} (${user.username})`);

  // 2. Create Default Categories
  const categoriesData = [
    { name: 'Food', icon: 'Utensils', color: '#f97316', isInvestment: false },
    { name: 'Groceries', icon: 'ShoppingCart', color: '#10b981', isInvestment: false },
    { name: 'Transportation', icon: 'Car', color: '#06b6d4', isInvestment: false },
    { name: 'Bills & Utilities', icon: 'Zap', color: '#eab308', isInvestment: false },
    { name: 'Rent', icon: 'Home', color: '#8b5cf6', isInvestment: false },
    { name: 'Internet', icon: 'Wifi', color: '#3b82f6', isInvestment: false },
    { name: 'Mobile', icon: 'Smartphone', color: '#ec4899', isInvestment: false },
    { name: 'Shopping', icon: 'ShoppingBag', color: '#f43f5e', isInvestment: false },
    { name: 'Entertainment', icon: 'Film', color: '#a855f7', isInvestment: false },
    { name: 'Health', icon: 'HeartPulse', color: '#ef4444', isInvestment: false },
    { name: 'Education', icon: 'GraduationCap', color: '#14b8a6', isInvestment: false },
    { name: 'Investment', icon: 'TrendingUp', color: '#22c55e', isInvestment: true },
    { name: 'Family', icon: 'Users', color: '#f59e0b', isInvestment: false },
    { name: 'Travel', icon: 'Plane', color: '#6366f1', isInvestment: false },
    { name: 'Personal', icon: 'User', color: '#64748b', isInvestment: false },
    { name: 'Subscriptions', icon: 'Tv', color: '#d946ef', isInvestment: false },
    { name: 'Other', icon: 'HelpCircle', color: '#94a3b8', isInvestment: false },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: {
        userId: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isInvestment: cat.isInvestment,
        isDefault: true,
      },
    });
    categoryMap[cat.name] = created;
  }
  console.log(`Created ${Object.keys(categoryMap).length} categories`);

  // 3. Create Default Payment Methods
  const paymentMethodsData = [
    { name: 'Cash', icon: 'Banknote', isDefault: true },
    { name: 'Bank', icon: 'Building2', isDefault: false },
    { name: 'Debit Card', icon: 'CreditCard', isDefault: false },
    { name: 'Credit Card', icon: 'CreditCard', isDefault: false },
    { name: 'eSewa', icon: 'Smartphone', isDefault: false },
    { name: 'Khalti', icon: 'Smartphone', isDefault: false },
    { name: 'Other', icon: 'Wallet', isDefault: false },
  ];

  const paymentMap = {};
  for (const pm of paymentMethodsData) {
    const created = await prisma.paymentMethod.create({
      data: {
        userId: user.id,
        name: pm.name,
        icon: pm.icon,
        isDefault: pm.isDefault,
      },
    });
    paymentMap[pm.name] = created;
  }
  console.log(`Created ${Object.keys(paymentMap).length} payment methods`);

  // 4. Create Salary Cycles
  // Cycle 1: July 5 -> Aug 4, 2026 (Closed)
  const cycleJuly = await prisma.salaryMonth.create({
    data: {
      userId: user.id,
      name: 'July 2026',
      startDate: new Date('2026-07-05T00:00:00Z'),
      endDate: new Date('2026-08-04T23:59:59Z'),
      baseSalary: 60000,
      bonus: 0,
      otherIncome: 0,
      totalIncome: 60000,
      status: 'CLOSED',
      notes: 'July financial cycle',
    },
  });

  // Cycle 2: Aug 5 -> Sep 4, 2026 (Closed)
  const cycleAug = await prisma.salaryMonth.create({
    data: {
      userId: user.id,
      name: 'August 2026',
      startDate: new Date('2026-08-05T00:00:00Z'),
      endDate: new Date('2026-09-04T23:59:59Z'),
      baseSalary: 60000,
      bonus: 0,
      otherIncome: 0,
      totalIncome: 60000,
      status: 'CLOSED',
      notes: 'August financial cycle',
    },
  });

  // Cycle 3: Sep 5 -> Oct 4, 2026 (ACTIVE - covers today Sep 6, 2026!)
  const cycleSep = await prisma.salaryMonth.create({
    data: {
      userId: user.id,
      name: 'September 2026',
      startDate: new Date('2026-09-05T00:00:00Z'),
      endDate: new Date('2026-10-04T23:59:59Z'),
      baseSalary: 60000,
      bonus: 10000,
      otherIncome: 0,
      totalIncome: 70000,
      status: 'ACTIVE',
      notes: 'Festival bonus received this cycle!',
    },
  });

  // Income records
  await prisma.income.createMany({
    data: [
      {
        userId: user.id,
        salaryMonthId: cycleJuly.id,
        source: 'Salary',
        amount: 60000,
        date: new Date('2026-07-05T08:00:00Z'),
        description: 'Monthly Salary credited',
      },
      {
        userId: user.id,
        salaryMonthId: cycleAug.id,
        source: 'Salary',
        amount: 60000,
        date: new Date('2026-08-05T08:00:00Z'),
        description: 'Monthly Salary credited',
      },
      {
        userId: user.id,
        salaryMonthId: cycleSep.id,
        source: 'Salary',
        amount: 60000,
        date: new Date('2026-09-05T08:00:00Z'),
        description: 'Base Monthly Salary',
      },
      {
        userId: user.id,
        salaryMonthId: cycleSep.id,
        source: 'Bonus',
        amount: 10000,
        date: new Date('2026-09-05T09:00:00Z'),
        description: 'Quarterly Festival Bonus',
      },
    ],
  });

  // 5. Recurring Expenses Rules
  const recurringRules = [
    {
      userId: user.id,
      name: 'Internet Fiber',
      amount: 1500,
      frequency: 'MONTHLY',
      dayOfMonth: 7,
      categoryId: categoryMap['Internet'].id,
      paymentMethodId: paymentMap['eSewa'].id,
      isInvestment: false,
      isEnabled: true,
      startDate: new Date('2026-01-01T00:00:00Z'),
    },
    {
      userId: user.id,
      name: 'SIP Mutual Fund',
      amount: 3000,
      frequency: 'MONTHLY',
      dayOfMonth: 10,
      categoryId: categoryMap['Investment'].id,
      paymentMethodId: paymentMap['Bank'].id,
      isInvestment: true,
      isEnabled: true,
      startDate: new Date('2026-01-01T00:00:00Z'),
    },
    {
      userId: user.id,
      name: 'Netflix & Streaming',
      amount: 800,
      frequency: 'MONTHLY',
      dayOfMonth: 15,
      categoryId: categoryMap['Subscriptions'].id,
      paymentMethodId: paymentMap['Credit Card'].id,
      isInvestment: false,
      isEnabled: true,
      startDate: new Date('2026-01-01T00:00:00Z'),
    },
    {
      userId: user.id,
      name: 'Gym Membership',
      amount: 2500,
      frequency: 'MONTHLY',
      dayOfMonth: 20,
      categoryId: categoryMap['Health'].id,
      paymentMethodId: paymentMap['Bank'].id,
      isInvestment: false,
      isEnabled: true,
      startDate: new Date('2026-01-01T00:00:00Z'),
    },
  ];

  const createdRecurring = [];
  for (const r of recurringRules) {
    const rec = await prisma.recurringExpense.create({ data: r });
    createdRecurring.push(rec);
  }

  // Generate Recurring Instances for current cycle (Sep 5 - Oct 4)
  for (const rec of createdRecurring) {
    let day = rec.dayOfMonth || 5;
    let expectedMonth = 8; // September
    if (day < 5) expectedMonth = 9; // October
    const expectedDate = new Date(Date.UTC(2026, expectedMonth, day, 10, 0, 0));

    await prisma.recurringExpenseInstance.create({
      data: {
        recurringExpenseId: rec.id,
        salaryMonthId: cycleSep.id,
        expectedDate,
        amount: rec.amount,
        status: 'PENDING',
      },
    });
  }

  // 6. Budgets for active cycle
  const budgetList = [
    { categoryId: categoryMap['Food'].id, amount: 8000 },
    { categoryId: categoryMap['Groceries'].id, amount: 10000 },
    { categoryId: categoryMap['Transportation'].id, amount: 4000 },
    { categoryId: categoryMap['Shopping'].id, amount: 5000 },
    { categoryId: categoryMap['Entertainment'].id, amount: 3000 },
  ];

  for (const b of budgetList) {
    await prisma.budget.create({
      data: {
        userId: user.id,
        salaryMonthId: cycleSep.id,
        categoryId: b.categoryId,
        amount: b.amount,
      },
    });
  }

  // 7. Seed Past Expenses (July cycle: ~Rs. 35,800 total outflow, saved ~Rs. 24,200)
  const julyExpenses = [
    { desc: 'Supermarket Groceries', amt: 7200, cat: 'Groceries', date: '2026-07-07T12:00:00Z', pm: 'Debit Card' },
    { desc: 'Internet Bill', amt: 1500, cat: 'Internet', date: '2026-07-07T14:00:00Z', pm: 'eSewa' },
    { desc: 'SIP Investment', amt: 3000, cat: 'Investment', date: '2026-07-10T10:00:00Z', pm: 'Bank', isInv: true },
    { desc: 'Cafe & Dinners', amt: 5400, cat: 'Food', date: '2026-07-14T19:00:00Z', pm: 'Cash' },
    { desc: 'Fuel and Rides', amt: 3200, cat: 'Transportation', date: '2026-07-18T16:00:00Z', pm: 'Khalti' },
    { desc: 'Clothes Shopping', amt: 4500, cat: 'Shopping', date: '2026-07-22T17:00:00Z', pm: 'Credit Card' },
    { desc: 'Family Support', amt: 6000, cat: 'Family', date: '2026-07-28T11:00:00Z', pm: 'Bank' },
    { desc: 'Movies and Outing', amt: 2500, cat: 'Entertainment', date: '2026-08-01T20:00:00Z', pm: 'Cash' },
    { desc: 'Pharmacy and Medicines', amt: 2500, cat: 'Health', date: '2026-08-03T15:00:00Z', pm: 'Cash' },
  ];
  for (const e of julyExpenses) {
    await prisma.expense.create({
      data: {
        userId: user.id,
        salaryMonthId: cycleJuly.id,
        categoryId: categoryMap[e.cat].id,
        paymentMethodId: paymentMap[e.pm].id,
        amount: e.amt,
        date: new Date(e.date),
        description: e.desc,
        isInvestment: Boolean(e.isInv),
      },
    });
  }

  // 8. Seed Past Expenses (August cycle: ~Rs. 39,200 total outflow, saved ~Rs. 20,800)
  const augExpenses = [
    { desc: 'Monthly Groceries stock', amt: 8500, cat: 'Groceries', date: '2026-08-06T11:00:00Z', pm: 'Debit Card' },
    { desc: 'Internet monthly', amt: 1500, cat: 'Internet', date: '2026-08-07T12:00:00Z', pm: 'eSewa' },
    { desc: 'SIP monthly index fund', amt: 3000, cat: 'Investment', date: '2026-08-10T10:00:00Z', pm: 'Bank', isInv: true },
    { desc: 'Work lunches & dining out', amt: 6200, cat: 'Food', date: '2026-08-15T13:00:00Z', pm: 'Cash' },
    { desc: 'Bike servicing & petrol', amt: 3800, cat: 'Transportation', date: '2026-08-18T16:00:00Z', pm: 'Cash' },
    { desc: 'Gadget accessories', amt: 5200, cat: 'Shopping', date: '2026-08-22T15:00:00Z', pm: 'Credit Card' },
    { desc: 'Netflix Subscription', amt: 800, cat: 'Subscriptions', date: '2026-08-25T10:00:00Z', pm: 'Credit Card' },
    { desc: 'Family gathering dinner', amt: 5000, cat: 'Family', date: '2026-08-28T20:00:00Z', pm: 'Bank' },
    { desc: 'Cinema with friends', amt: 2200, cat: 'Entertainment', date: '2026-08-30T18:00:00Z', pm: 'Cash' },
    { desc: 'Gym membership renewal', amt: 3000, cat: 'Health', date: '2026-09-02T09:00:00Z', pm: 'Bank' },
  ];
  for (const e of augExpenses) {
    await prisma.expense.create({
      data: {
        userId: user.id,
        salaryMonthId: cycleAug.id,
        categoryId: categoryMap[e.cat].id,
        paymentMethodId: paymentMap[e.pm].id,
        amount: e.amt,
        date: new Date(e.date),
        description: e.desc,
        isInvestment: Boolean(e.isInv),
      },
    });
  }

  // 9. Seed Active Month Expenses (Sep 5 -> Oct 4, 2026)
  // Today is Sep 6, 2026!
  const sepExpenses = [
    { desc: 'Groceries at Mart', amt: 2450, cat: 'Groceries', date: '2026-09-05T14:30:00Z', pm: 'Debit Card' },
    { desc: 'Mobile Data Recharge', amt: 500, cat: 'Mobile', date: '2026-09-05T16:00:00Z', pm: 'eSewa' },
    { desc: 'Lunch with colleagues', amt: 450, cat: 'Food', date: '2026-09-06T13:00:00Z', pm: 'Cash' },
    { desc: 'Espresso & Bakery', amt: 180, cat: 'Food', date: '2026-09-06T15:15:00Z', pm: 'Cash' },
    { desc: 'Taxi commute', amt: 320, cat: 'Transportation', date: '2026-09-06T16:00:00Z', pm: 'Khalti' },
  ];

  for (const e of sepExpenses) {
    await prisma.expense.create({
      data: {
        userId: user.id,
        salaryMonthId: cycleSep.id,
        categoryId: categoryMap[e.cat].id,
        paymentMethodId: paymentMap[e.pm].id,
        amount: e.amt,
        date: new Date(e.date),
        description: e.desc,
        isInvestment: Boolean(e.isInv),
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
