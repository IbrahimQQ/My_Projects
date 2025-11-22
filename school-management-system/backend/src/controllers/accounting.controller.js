const { FeeStructure, Invoice, Payment, Expense, Salary, Student, Class, AcademicYear, Term, TeacherProfile, User } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');
const { Op } = require('sequelize');

// Fee Structure Management
exports.createFeeStructure = async (req, res) => {
  try {
    const { name, type, amount, frequency, dueDay, isOptional, classId, academicYearId } = req.body;

    const feeStructure = await FeeStructure.create({
      name,
      type,
      amount,
      frequency,
      dueDay,
      isOptional,
      classId,
      academicYearId
    });

    await createAuditLog(req.userId, 'CREATE_FEE_STRUCTURE', 'FeeStructure', feeStructure.id, null, feeStructure.toJSON(), req);

    res.status(201).json({
      message: 'Fee structure created successfully',
      data: feeStructure
    });
  } catch (error) {
    console.error('Create fee structure error:', error);
    res.status(500).json({ error: 'Failed to create fee structure' });
  }
};

exports.getFeeStructures = async (req, res) => {
  try {
    const { classId, academicYearId, type } = req.query;
    const where = {};

    if (classId) where.classId = classId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (type) where.type = type;

    const feeStructures = await FeeStructure.findAll({
      where,
      include: [
        { model: Class },
        { model: AcademicYear }
      ],
      order: [['type', 'ASC']]
    });

    res.json({ data: feeStructures });
  } catch (error) {
    console.error('Get fee structures error:', error);
    res.status(500).json({ error: 'Failed to get fee structures' });
  }
};

exports.updateFeeStructure = async (req, res) => {
  try {
    const feeStructure = await FeeStructure.findByPk(req.params.id);

    if (!feeStructure) {
      return res.status(404).json({ error: 'Fee structure not found' });
    }

    const { name, type, amount, frequency, dueDay, isOptional } = req.body;

    await feeStructure.update({
      name: name || feeStructure.name,
      type: type || feeStructure.type,
      amount: amount || feeStructure.amount,
      frequency: frequency || feeStructure.frequency,
      dueDay: dueDay || feeStructure.dueDay,
      isOptional: isOptional !== undefined ? isOptional : feeStructure.isOptional
    });

    res.json({
      message: 'Fee structure updated successfully',
      data: feeStructure
    });
  } catch (error) {
    console.error('Update fee structure error:', error);
    res.status(500).json({ error: 'Failed to update fee structure' });
  }
};

exports.deleteFeeStructure = async (req, res) => {
  try {
    const feeStructure = await FeeStructure.findByPk(req.params.id);

    if (!feeStructure) {
      return res.status(404).json({ error: 'Fee structure not found' });
    }

    await feeStructure.destroy();
    res.json({ message: 'Fee structure deleted successfully' });
  } catch (error) {
    console.error('Delete fee structure error:', error);
    res.status(500).json({ error: 'Failed to delete fee structure' });
  }
};

// Invoice Management
exports.createInvoice = async (req, res) => {
  try {
    const { studentId, items, dueDate, tax, discount, notes, academicYearId, termId } = req.body;

    const amount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const totalAmount = amount + (tax || 0) - (discount || 0);

    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      studentId,
      amount,
      tax: tax || 0,
      discount: discount || 0,
      totalAmount,
      dueDate,
      items,
      notes,
      academicYearId,
      termId,
      status: 'pending'
    });

    await createAuditLog(req.userId, 'CREATE_INVOICE', 'Invoice', invoice.id, null, invoice.toJSON(), req);

    res.status(201).json({
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, studentId, status, academicYearId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (academicYearId) where.academicYearId = academicYearId;

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Student },
        { model: AcademicYear },
        { model: Term }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Student, include: [{ model: Class }] },
        { model: AcademicYear },
        { model: Term }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get payments for this invoice
    const payments = await Payment.findAll({
      where: { invoiceId: invoice.id },
      order: [['paymentDate', 'DESC']]
    });

    res.json({
      data: {
        ...invoice.toJSON(),
        payments,
        amountPaid: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
        balance: invoice.totalAmount - payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
};

// Payment Management
exports.recordPayment = async (req, res) => {
  try {
    const { invoiceId, amount, method, referenceNumber, notes } = req.body;

    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const payment = await Payment.create({
      invoiceId,
      amount,
      method,
      referenceNumber,
      notes,
      receivedBy: req.userId,
      status: 'completed'
    });

    // Update invoice status
    const totalPaid = await Payment.sum('amount', {
      where: { invoiceId, status: 'completed' }
    });

    let newStatus = 'pending';
    if (totalPaid >= invoice.totalAmount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    }

    await invoice.update({ status: newStatus });

    await createAuditLog(req.userId, 'RECORD_PAYMENT', 'Payment', payment.id, null, payment.toJSON(), req);

    res.status(201).json({
      message: 'Payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, invoiceId, method, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (invoiceId) where.invoiceId = invoiceId;
    if (method) where.method = method;
    if (startDate && endDate) {
      where.paymentDate = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Invoice, include: [{ model: Student }] },
        { model: User, as: 'receivedBy' }
      ],
      limit: parseInt(limit),
      offset,
      order: [['paymentDate', 'DESC']]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
};

// Expense Management
exports.createExpense = async (req, res) => {
  try {
    const { category, description, amount, date, receipt, vendor } = req.body;

    const expense = await Expense.create({
      category,
      description,
      amount,
      date,
      receipt,
      vendor,
      createdBy: req.userId,
      status: 'pending'
    });

    await createAuditLog(req.userId, 'CREATE_EXPENSE', 'Expense', expense.id, null, expense.toJSON(), req);

    res.status(201).json({
      message: 'Expense created successfully',
      data: expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows } = await Expense.findAndCountAll({
      where,
      include: [
        { model: User, as: 'createdBy' },
        { model: User, as: 'approver' }
      ],
      limit: parseInt(limit),
      offset,
      order: [['date', 'DESC']]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to get expenses' });
  }
};

exports.approveExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const { status } = req.body; // 'approved' or 'rejected'

    await expense.update({
      status,
      approvedBy: req.userId
    });

    res.json({
      message: `Expense ${status} successfully`,
      data: expense
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

// Salary Management
exports.processSalaries = async (req, res) => {
  try {
    const { month, year } = req.body;

    const teachers = await TeacherProfile.findAll({
      include: [{ model: User, where: { isActive: true } }]
    });

    const salaries = [];

    for (const teacher of teachers) {
      const existingSalary = await Salary.findOne({
        where: { teacherId: teacher.id, month, year }
      });

      if (!existingSalary) {
        const salary = await Salary.create({
          teacherId: teacher.id,
          month,
          year,
          baseSalary: teacher.salary || 0,
          allowances: 0,
          deductions: 0,
          netSalary: teacher.salary || 0,
          status: 'pending'
        });
        salaries.push(salary);
      }
    }

    res.json({
      message: `${salaries.length} salaries processed`,
      data: salaries
    });
  } catch (error) {
    console.error('Process salaries error:', error);
    res.status(500).json({ error: 'Failed to process salaries' });
  }
};

exports.getSalaries = async (req, res) => {
  try {
    const { month, year, status } = req.query;
    const where = {};

    if (month) where.month = month;
    if (year) where.year = year;
    if (status) where.status = status;

    const salaries = await Salary.findAll({
      where,
      include: [{
        model: TeacherProfile,
        include: [{ model: User }]
      }],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    res.json({ data: salaries });
  } catch (error) {
    console.error('Get salaries error:', error);
    res.status(500).json({ error: 'Failed to get salaries' });
  }
};

exports.paySalary = async (req, res) => {
  try {
    const salary = await Salary.findByPk(req.params.id);

    if (!salary) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    await salary.update({
      status: 'paid',
      paidAt: new Date()
    });

    res.json({
      message: 'Salary paid successfully',
      data: salary
    });
  } catch (error) {
    console.error('Pay salary error:', error);
    res.status(500).json({ error: 'Failed to pay salary' });
  }
};

// Financial Reports
exports.getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = startDate && endDate ? { [Op.between]: [startDate, endDate] } : {};

    // Total revenue
    const totalRevenue = await Payment.sum('amount', {
      where: { status: 'completed', ...(startDate && endDate ? { paymentDate: dateFilter } : {}) }
    }) || 0;

    // Total expenses
    const totalExpenses = await Expense.sum('amount', {
      where: { status: { [Op.in]: ['approved', 'paid'] }, ...(startDate && endDate ? { date: dateFilter } : {}) }
    }) || 0;

    // Total salaries paid
    const totalSalaries = await Salary.sum('netSalary', {
      where: { status: 'paid', ...(startDate && endDate ? { paidAt: dateFilter } : {}) }
    }) || 0;

    // Pending fees
    const pendingFees = await Invoice.sum('totalAmount', {
      where: { status: { [Op.in]: ['pending', 'partial'] } }
    }) || 0;

    // Revenue by category
    const revenueByType = await Payment.findAll({
      attributes: [
        [require('sequelize').col('Invoice.items'), 'items'],
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total']
      ],
      where: { status: 'completed' },
      include: [{ model: Invoice, attributes: [] }],
      group: ['Invoice.items'],
      raw: true
    });

    // Expenses by category
    const expensesByCategory = await Expense.findAll({
      attributes: [
        'category',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total']
      ],
      where: { status: { [Op.in]: ['approved', 'paid'] } },
      group: ['category'],
      raw: true
    });

    res.json({
      data: {
        totalRevenue,
        totalExpenses,
        totalSalaries,
        pendingFees,
        netIncome: totalRevenue - totalExpenses - totalSalaries,
        expensesByCategory,
        revenueByType
      }
    });
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({ error: 'Failed to get financial summary' });
  }
};
