const { AcademicYear, Term, Class } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');

// Create academic year
exports.createAcademicYear = async (req, res) => {
  try {
    const { name, startDate, endDate, isCurrent, terms } = req.body;

    // If setting as current, unset other current years
    if (isCurrent) {
      await AcademicYear.update({ isCurrent: false }, { where: { isCurrent: true } });
    }

    const academicYear = await AcademicYear.create({
      name,
      startDate,
      endDate,
      isCurrent: isCurrent || false
    });

    // Create terms if provided
    if (terms && terms.length > 0) {
      for (const term of terms) {
        await Term.create({
          ...term,
          academicYearId: academicYear.id
        });
      }
    }

    await createAuditLog(req.userId, 'CREATE_ACADEMIC_YEAR', 'AcademicYear', academicYear.id, null, academicYear.toJSON(), req);

    const result = await AcademicYear.findByPk(academicYear.id, {
      include: [{ model: Term, as: 'terms' }]
    });

    res.status(201).json({
      message: 'Academic year created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create academic year error:', error);
    res.status(500).json({ error: 'Failed to create academic year' });
  }
};

// Get all academic years
exports.getAcademicYears = async (req, res) => {
  try {
    const academicYears = await AcademicYear.findAll({
      include: [
        { model: Term, as: 'terms' },
        { model: Class, as: 'classes' }
      ],
      order: [['startDate', 'DESC']]
    });

    res.json({ data: academicYears });
  } catch (error) {
    console.error('Get academic years error:', error);
    res.status(500).json({ error: 'Failed to get academic years' });
  }
};

// Get current academic year
exports.getCurrentAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findOne({
      where: { isCurrent: true },
      include: [
        { model: Term, as: 'terms' },
        { model: Class, as: 'classes' }
      ]
    });

    if (!academicYear) {
      return res.status(404).json({ error: 'No current academic year set' });
    }

    res.json({ data: academicYear });
  } catch (error) {
    console.error('Get current academic year error:', error);
    res.status(500).json({ error: 'Failed to get current academic year' });
  }
};

// Get single academic year
exports.getAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findByPk(req.params.id, {
      include: [
        { model: Term, as: 'terms' },
        { model: Class, as: 'classes' }
      ]
    });

    if (!academicYear) {
      return res.status(404).json({ error: 'Academic year not found' });
    }

    res.json({ data: academicYear });
  } catch (error) {
    console.error('Get academic year error:', error);
    res.status(500).json({ error: 'Failed to get academic year' });
  }
};

// Update academic year
exports.updateAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findByPk(req.params.id);

    if (!academicYear) {
      return res.status(404).json({ error: 'Academic year not found' });
    }

    const { name, startDate, endDate, isCurrent } = req.body;

    // If setting as current, unset other current years
    if (isCurrent && !academicYear.isCurrent) {
      await AcademicYear.update({ isCurrent: false }, { where: { isCurrent: true } });
    }

    await academicYear.update({
      name: name || academicYear.name,
      startDate: startDate || academicYear.startDate,
      endDate: endDate || academicYear.endDate,
      isCurrent: isCurrent !== undefined ? isCurrent : academicYear.isCurrent
    });

    await createAuditLog(req.userId, 'UPDATE_ACADEMIC_YEAR', 'AcademicYear', academicYear.id, null, academicYear.toJSON(), req);

    res.json({
      message: 'Academic year updated successfully',
      data: academicYear
    });
  } catch (error) {
    console.error('Update academic year error:', error);
    res.status(500).json({ error: 'Failed to update academic year' });
  }
};

// Delete academic year
exports.deleteAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findByPk(req.params.id);

    if (!academicYear) {
      return res.status(404).json({ error: 'Academic year not found' });
    }

    // Check for associated classes
    const classCount = await Class.count({ where: { academicYearId: academicYear.id } });
    if (classCount > 0) {
      return res.status(400).json({ error: 'Cannot delete academic year with associated classes' });
    }

    await academicYear.destroy();
    await createAuditLog(req.userId, 'DELETE_ACADEMIC_YEAR', 'AcademicYear', req.params.id, null, null, req);

    res.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    console.error('Delete academic year error:', error);
    res.status(500).json({ error: 'Failed to delete academic year' });
  }
};

// Create term
exports.createTerm = async (req, res) => {
  try {
    const { name, startDate, endDate, isCurrent, academicYearId } = req.body;

    if (isCurrent) {
      await Term.update({ isCurrent: false }, { where: { isCurrent: true, academicYearId } });
    }

    const term = await Term.create({
      name,
      startDate,
      endDate,
      isCurrent: isCurrent || false,
      academicYearId
    });

    await createAuditLog(req.userId, 'CREATE_TERM', 'Term', term.id, null, term.toJSON(), req);

    res.status(201).json({
      message: 'Term created successfully',
      data: term
    });
  } catch (error) {
    console.error('Create term error:', error);
    res.status(500).json({ error: 'Failed to create term' });
  }
};

// Update term
exports.updateTerm = async (req, res) => {
  try {
    const term = await Term.findByPk(req.params.termId);

    if (!term) {
      return res.status(404).json({ error: 'Term not found' });
    }

    const { name, startDate, endDate, isCurrent } = req.body;

    if (isCurrent && !term.isCurrent) {
      await Term.update({ isCurrent: false }, { where: { isCurrent: true, academicYearId: term.academicYearId } });
    }

    await term.update({
      name: name || term.name,
      startDate: startDate || term.startDate,
      endDate: endDate || term.endDate,
      isCurrent: isCurrent !== undefined ? isCurrent : term.isCurrent
    });

    await createAuditLog(req.userId, 'UPDATE_TERM', 'Term', term.id, null, term.toJSON(), req);

    res.json({
      message: 'Term updated successfully',
      data: term
    });
  } catch (error) {
    console.error('Update term error:', error);
    res.status(500).json({ error: 'Failed to update term' });
  }
};

// Delete term
exports.deleteTerm = async (req, res) => {
  try {
    const term = await Term.findByPk(req.params.termId);

    if (!term) {
      return res.status(404).json({ error: 'Term not found' });
    }

    await term.destroy();
    await createAuditLog(req.userId, 'DELETE_TERM', 'Term', req.params.termId, null, null, req);

    res.json({ message: 'Term deleted successfully' });
  } catch (error) {
    console.error('Delete term error:', error);
    res.status(500).json({ error: 'Failed to delete term' });
  }
};
