const prisma = require('../config/prisma');
const termii = require('../services/termii');
const mailer = require('../services/mailer');
const pdfService = require('../services/pdfService');

/**
 * List all submissions for staff/admin with filters & search
 */
async function getSubmissions(req, res, next) {
  try {
    const { status, departmentId, search, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = {};

    // If staff user is restricted to their department
    if (req.user.role === 'STAFF' && req.user.departmentId) {
      where.user = { departmentId: req.user.departmentId };
    } else if (departmentId) {
      where.user = { departmentId };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      const searchCondition = {
        OR: [
          { referenceNumber: { contains: search } },
          { user: { matricNo: { contains: search } } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      };
      if (where.user) {
        where.AND = [searchCondition];
      } else {
        Object.assign(where, searchCondition);
      }
    }

    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) where.submittedAt.gte = new Date(startDate);
      if (endDate) where.submittedAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [submissions, totalCount] = await Promise.all([
      prisma.fileSubmission.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              matricNo: true,
              department: true,
            },
          },
          submittedDocuments: {
            include: { documentType: true },
          },
          statusHistories: {
            orderBy: { changedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fileSubmission.count({ where }),
    ]);

    return res.json({
      submissions,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get full submission detail for admin review
 */
async function getSubmissionById(req, res, next) {
  try {
    const { id } = req.params;

    const submission = await prisma.fileSubmission.findUnique({
      where: { id },
      include: {
        user: {
          include: { department: true },
        },
        submittedDocuments: {
          include: {
            documentType: true,
            reviewer: { select: { id: true, name: true, role: true } },
          },
          orderBy: { uploadedAt: 'desc' },
        },
        statusHistories: {
          include: {
            changer: { select: { id: true, name: true, role: true } },
          },
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    return res.json({ submission });
  } catch (error) {
    next(error);
  }
}

/**
 * Review individual document (Approve/Reject + Comment)
 */
async function reviewDocument(req, res, next) {
  try {
    const { id: docId } = req.params;
    const { status, reviewComment } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid document status.' });
    }

    const doc = await prisma.submittedDocument.findUnique({
      where: { id: docId },
      include: { submission: true },
    });

    if (!doc) {
      return res.status(404).json({ error: 'Submitted document record not found.' });
    }

    const updatedDoc = await prisma.submittedDocument.update({
      where: { id: docId },
      data: {
        status,
        reviewComment: reviewComment || null,
        reviewedBy: req.user.id,
      },
      include: {
        documentType: true,
        reviewer: { select: { id: true, name: true, role: true } },
      },
    });

    return res.json({
      message: `Document status updated to ${status}.`,
      document: updatedDoc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update overall submission status (PENDING -> UNDER_REVIEW -> APPROVED / REJECTED)
 * Triggers audit log in status_history and student SMS & Email alerts
 */
async function updateSubmissionStatus(req, res, next) {
  try {
    const { id: submissionId } = req.params;
    const { status, comment } = req.body;

    if (!['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid submission status.' });
    }

    const submission = await prisma.fileSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: { include: { department: true } },
        submittedDocuments: { include: { documentType: true } },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const oldStatus = submission.status;

    // Update submission
    const updatedSubmission = await prisma.fileSubmission.update({
      where: { id: submissionId },
      data: { status },
      include: {
        user: { include: { department: true } },
        submittedDocuments: { include: { documentType: true } },
        statusHistories: { include: { changer: true }, orderBy: { changedAt: 'desc' } },
      },
    });

    // Create Audit Log in status_history
    await prisma.statusHistory.create({
      data: {
        submissionId,
        oldStatus,
        newStatus: status,
        changedBy: req.user.id,
      },
    });

    // Re-generate Acknowledgement PDF with new status watermark
    try {
      const pdfResult = await pdfService.generateAcknowledgementPdf(updatedSubmission);
      await prisma.fileSubmission.update({
        where: { id: submissionId },
        data: { acknowledgementPdfUrl: pdfResult.relativeUrl },
      });
    } catch (pdfErr) {
      console.error('Failed to re-generate PDF upon status update:', pdfErr.message);
    }

    // Trigger Notifications (Termii SMS + Mailer Email)
    const ref = submission.referenceNumber || 'DFOS Submission';
    const statusText = status.replace('_', ' ');
    const smsMessage = `DFOS Notice: Your file submission (${ref}) status has been updated to ${statusText}.${comment ? ` Note: ${comment}` : ''}`;

    await termii.sendNotification(submission.user.phone, smsMessage);
    await mailer.sendStatusUpdateEmail(
      submission.user.email,
      submission.user.name,
      ref,
      status,
      comment
    );

    return res.json({
      message: `Submission status updated from ${oldStatus} to ${status}.`,
      submission: updatedSubmission,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export Submissions report as CSV
 */
async function exportSubmissionsCsv(req, res, next) {
  try {
    const { status, departmentId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (departmentId) where.user = { departmentId };

    const submissions = await prisma.fileSubmission.findMany({
      where,
      include: {
        user: { include: { department: true } },
        submittedDocuments: { include: { documentType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV Header
    const headers = [
      'Reference Number',
      'Student Name',
      'Matric Number',
      'Email',
      'Phone',
      'Department',
      'Status',
      'Total Documents Uploaded',
      'Submitted At',
      'Created At',
    ];

    const rows = submissions.map((sub) => [
      `"${sub.referenceNumber || 'N/A'}"`,
      `"${sub.user?.name || ''}"`,
      `"${sub.user?.matricNo || ''}"`,
      `"${sub.user?.email || ''}"`,
      `"${sub.user?.phone || ''}"`,
      `"${sub.user?.department?.name || ''}"`,
      `"${sub.status}"`,
      sub.submittedDocuments?.length || 0,
      `"${sub.submittedAt ? new Date(sub.submittedAt).toISOString() : 'N/A'}"`,
      `"${new Date(sub.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dfos_submissions_export_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    next(error);
  }
}

/**
 * Dashboard stats summary
 */
async function getAdminStats(req, res, next) {
  try {
    const where = {};
    if (req.user.role === 'STAFF' && req.user.departmentId) {
      where.user = { departmentId: req.user.departmentId };
    }

    const [total, pending, underReview, approved, rejected] = await Promise.all([
      prisma.fileSubmission.count({ where }),
      prisma.fileSubmission.count({ where: { ...where, status: 'PENDING' } }),
      prisma.fileSubmission.count({ where: { ...where, status: 'UNDER_REVIEW' } }),
      prisma.fileSubmission.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.fileSubmission.count({ where: { ...where, status: 'REJECTED' } }),
    ]);

    return res.json({
      stats: {
        total,
        pending,
        underReview,
        approved,
        rejected,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSubmissions,
  getSubmissionById,
  reviewDocument,
  updateSubmissionStatus,
  exportSubmissionsCsv,
  getAdminStats,
};
