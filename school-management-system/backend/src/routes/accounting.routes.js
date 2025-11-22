const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const accountingController = require('../controllers/accounting.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);
router.use(authorize('principal', 'admin', 'accountant'));

// Fee Structure
router.post('/fee-structures',
  [
    body('name').notEmpty().trim(),
    body('type').isIn(['tuition', 'registration', 'exam', 'transport', 'library', 'lab', 'sports', 'other']),
    body('amount').isDecimal()
  ],
  handleValidationErrors,
  accountingController.createFeeStructure
);
router.get('/fee-structures', accountingController.getFeeStructures);
router.put('/fee-structures/:id', accountingController.updateFeeStructure);
router.delete('/fee-structures/:id', accountingController.deleteFeeStructure);

// Invoices
router.post('/invoices',
  [
    body('studentId').notEmpty(),
    body('items').isArray(),
    body('dueDate').isISO8601()
  ],
  handleValidationErrors,
  accountingController.createInvoice
);
router.get('/invoices', accountingController.getInvoices);
router.get('/invoices/:id', accountingController.getInvoice);

// Payments
router.post('/payments',
  [
    body('invoiceId').notEmpty(),
    body('amount').isDecimal(),
    body('method').isIn(['cash', 'card', 'bank_transfer', 'cheque', 'online'])
  ],
  handleValidationErrors,
  accountingController.recordPayment
);
router.get('/payments', accountingController.getPayments);

// Expenses
router.post('/expenses',
  [
    body('category').isIn(['salary', 'utilities', 'supplies', 'maintenance', 'transport', 'events', 'other']),
    body('description').notEmpty(),
    body('amount').isDecimal(),
    body('date').isISO8601()
  ],
  handleValidationErrors,
  accountingController.createExpense
);
router.get('/expenses', accountingController.getExpenses);
router.patch('/expenses/:id/approve', authorize('principal', 'admin'), accountingController.approveExpense);

// Salaries
router.post('/salaries/process',
  [
    body('month').isInt({ min: 1, max: 12 }),
    body('year').isInt()
  ],
  handleValidationErrors,
  accountingController.processSalaries
);
router.get('/salaries', accountingController.getSalaries);
router.patch('/salaries/:id/pay', accountingController.paySalary);

// Financial summary
router.get('/summary', accountingController.getFinancialSummary);

module.exports = router;
