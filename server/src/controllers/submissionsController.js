const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const { generateReferenceNumber } = require('../utils/reference');
const pdfService = require('../services/pdfService');
const termii = require('../services/termii');
const mailer = require('../services/mailer');

/**
 * Get or create an active submission for the logged-in student
 */
async function getOrCreateSubmission(req, res, next) {
  try {
    const userId = req.user.id;

    // Look for existing draft or active submission
    let submission = await prisma.fileSubmission.findFirst({
      where: {
        userId,
        status: { in: ['DRAFT', 'REJECTED', 'PENDING', 'UNDER_REVIEW', 'APPROVED'] },
      },
      include: {
        submittedDocuments: {
          include: { documentType: true },
        },
        statusHistories: {
          include: { changer: { select: { name: true, role: true } } },
          orderBy: { changedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!submission) {
      submission = await prisma.fileSubmission.create({
        data: {
          userId,
          status: 'DRAFT',
        },
        include: {
          submittedDocuments: {
            include: { documentType: true },
          },
          statusHistories: true,
        },
      });
    }

    return res.json({ submission });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all submissions for logged in student
 */
async function getMySubmissions(req, res, next) {
  try {
    const submissions = await prisma.fileSubmission.findMany({
      where: { userId: req.user.id },
      include: {
        submittedDocuments: {
          include: { documentType: true },
        },
        statusHistories: {
          orderBy: { changedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ submissions });
  } catch (error) {
    next(error);
  }
}

/**
 * Get specific submission details by ID
 */
async function getSubmissionById(req, res, next) {
  try {
    const { id } = req.params;

    const submission = await prisma.fileSubmission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            matricNo: true,
            role: true,
            department: true,
          },
        },
        submittedDocuments: {
          include: {
            documentType: true,
            reviewer: { select: { id: true, name: true, role: true } },
          },
          orderBy: { uploadedAt: 'desc' },
        },
        statusHistories: {
          include: { changer: { select: { id: true, name: true, role: true } } },
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission record not found.' });
    }

    // Check authorization (student can only access their own submission unless staff/admin)
    if (req.user.role === 'STUDENT' && submission.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    return res.json({ submission });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload a document for a submission
 */
async function uploadDocument(req, res, next) {
  try {
    const { id: submissionId } = req.params;
    const { documentTypeId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a valid document file.' });
    }

    if (!documentTypeId) {
      // Remove uploaded file if missing doc type
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Document type ID is required.' });
    }

    const submission = await prisma.fileSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Submission not found.' });
    }

    if (req.user.role === 'STUDENT' && submission.userId !== req.user.id) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Access denied.' });
    }

    const relativeFileUrl = `/uploads/documents/${req.file.filename}`;

    // Check if this document type was already uploaded for this submission
    const existingDoc = await prisma.submittedDocument.findFirst({
      where: {
        submissionId,
        documentTypeId,
      },
    });

    let submittedDoc;
    if (existingDoc) {
      // Remove old file from disk if exists
      const oldFilename = path.basename(existingDoc.fileUrl);
      const oldPath = path.join(__dirname, '../../uploads/documents', oldFilename);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error('Error unlinking old file:', e); }
      }

      submittedDoc = await prisma.submittedDocument.update({
        where: { id: existingDoc.id },
        data: {
          fileUrl: relativeFileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          status: 'PENDING',
          reviewComment: null,
          reviewedBy: null,
          uploadedAt: new Date(),
        },
        include: { documentType: true },
      });
    } else {
      submittedDoc = await prisma.submittedDocument.create({
        data: {
          submissionId,
          documentTypeId,
          fileUrl: relativeFileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          status: 'PENDING',
        },
        include: { documentType: true },
      });
    }

    return res.status(201).json({
      message: 'Document uploaded successfully.',
      document: submittedDoc,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(error);
  }
}

/**
 * Delete an uploaded document from submission
 */
async function deleteDocument(req, res, next) {
  try {
    const { id: submissionId, docId } = req.params;

    const doc = await prisma.submittedDocument.findUnique({
      where: { id: docId },
      include: { submission: true },
    });

    if (!doc || doc.submissionId !== submissionId) {
      return res.status(404).json({ error: 'Submitted document not found.' });
    }

    if (req.user.role === 'STUDENT' && doc.submission.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Unlink file from local disk
    const filename = path.basename(doc.fileUrl);
    const filePath = path.join(__dirname, '../../uploads/documents', filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }

    await prisma.submittedDocument.delete({
      where: { id: docId },
    });

    return res.json({ message: 'Document removed successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Finalize file submission (student action)
 * Generates reference number, pdf-lib acknowledgement PDF, updates status to PENDING, sends notification
 */
async function finalizeSubmission(req, res, next) {
  try {
    const { id: submissionId } = req.params;

    const submission = await prisma.fileSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          include: { department: true },
        },
        submittedDocuments: {
          include: { documentType: true },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission record not found.' });
    }

    if (submission.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Fetch required documents for student's department
    const requiredDocs = await prisma.requiredDocument.findMany({
      where: {
        OR: [
          { departmentId: req.user.departmentId },
          { isMandatory: true },
        ],
      },
    });

    const mandatoryDocIds = requiredDocs
      .filter((d) => d.isMandatory)
      .map((d) => d.id);

    const uploadedDocTypeIds = submission.submittedDocuments.map((d) => d.documentTypeId);

    const missingMandatoryDocs = requiredDocs.filter(
      (d) => d.isMandatory && !uploadedDocTypeIds.includes(d.id)
    );

    if (missingMandatoryDocs.length > 0) {
      return res.status(400).json({
        error: `Cannot submit. Mandatory documents are missing: ${missingMandatoryDocs.map((d) => d.name).join(', ')}`,
        missingDocuments: missingMandatoryDocs,
      });
    }

    // Generate unique reference number if not already assigned
    const referenceNumber = submission.referenceNumber || generateReferenceNumber();

    // Prepare updated submission payload
    const updatedSubmission = await prisma.fileSubmission.update({
      where: { id: submissionId },
      data: {
        referenceNumber,
        status: 'PENDING',
        submittedAt: new Date(),
      },
      include: {
        user: { include: { department: true } },
        submittedDocuments: { include: { documentType: true } },
      },
    });

    // Generate Acknowledgement PDF with pdf-lib
    const pdfResult = await pdfService.generateAcknowledgementPdf(updatedSubmission);

    // Store PDF URL
    const finalSubmission = await prisma.fileSubmission.update({
      where: { id: submissionId },
      data: {
        acknowledgementPdfUrl: pdfResult.relativeUrl,
      },
      include: {
        user: { include: { department: true } },
        submittedDocuments: { include: { documentType: true } },
        statusHistories: { include: { changer: true } },
      },
    });

    // Create Audit Log in status_history
    const oldStatus = submission.status || 'DRAFT';
    await prisma.statusHistory.create({
      data: {
        submissionId,
        oldStatus,
        newStatus: 'PENDING',
        changedBy: req.user.id,
      },
    });

    // Send notifications (Termii SMS & Mailer Email)
    const smsMessage = `DFOS Notice: Your file submission (${referenceNumber}) has been received successfully and is pending department review.`;
    await termii.sendNotification(req.user.phone, smsMessage);
    await mailer.sendStatusUpdateEmail(req.user.email, req.user.name, referenceNumber, 'PENDING');

    return res.json({
      message: 'File submission finalized successfully. Acknowledgement letter generated.',
      submission: finalSubmission,
      acknowledgementUrl: pdfResult.relativeUrl,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Download Acknowledgement PDF
 */
async function downloadAcknowledgementPdf(req, res, next) {
  try {
    const { id: submissionId } = req.params;

    const submission = await prisma.fileSubmission.findUnique({
      where: { id: submissionId },
      include: { user: { include: { department: true } }, submittedDocuments: { include: { documentType: true } } },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    if (req.user.role === 'STUDENT' && submission.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    let pdfRelativeUrl = submission.acknowledgementPdfUrl;
    let fullPdfPath = null;

    if (pdfRelativeUrl) {
      fullPdfPath = path.join(__dirname, '../../', pdfRelativeUrl);
    }

    // Re-generate if file missing on disk
    if (!fullPdfPath || !fs.existsSync(fullPdfPath)) {
      const pdfResult = await pdfService.generateAcknowledgementPdf(submission);
      pdfRelativeUrl = pdfResult.relativeUrl;
      fullPdfPath = pdfResult.fullPath;

      await prisma.fileSubmission.update({
        where: { id: submissionId },
        data: { acknowledgementPdfUrl: pdfRelativeUrl },
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Acknowledgement_${submission.referenceNumber || submissionId}.pdf"`);
    return res.sendFile(fullPdfPath);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOrCreateSubmission,
  getMySubmissions,
  getSubmissionById,
  uploadDocument,
  deleteDocument,
  finalizeSubmission,
  downloadAcknowledgementPdf,
};
