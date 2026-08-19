const prisma = require('../config/prisma');

/**
 * Get list of departments
 */
async function getDepartments(req, res, next) {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json({ departments });
  } catch (error) {
    next(error);
  }
}

/**
 * Get required document checklist for student's department or specified departmentId
 */
async function getRequiredDocuments(req, res, next) {
  try {
    const departmentId = req.query.departmentId || req.user?.departmentId;

    let whereClause = {};
    if (departmentId) {
      whereClause = { departmentId };
    }

    const requiredDocuments = await prisma.requiredDocument.findMany({
      where: whereClause,
      include: { department: true },
      orderBy: [{ isMandatory: 'desc' }, { name: 'asc' }],
    });

    return res.json({ requiredDocuments });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDepartments,
  getRequiredDocuments,
};
