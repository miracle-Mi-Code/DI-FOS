const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Helper to wrap and draw multi-line text blocks in pdf-lib
 */
function drawWrappedText(page, text, { x, y, maxWidth, fontSize, font, color, lineHeight = 15 }) {
  const words = text.split(' ');
  let currentLine = '';
  let currentY = y;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const lineWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (lineWidth > maxWidth) {
      page.drawText(currentLine, { x, y: currentY, size: fontSize, font, color });
      currentY -= lineHeight;
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    page.drawText(currentLine, { x, y: currentY, size: fontSize, font, color });
    currentY -= lineHeight;
  }
  return currentY;
}

/**
 * Format a Date object into a readable formal string e.g. "August 18, 2026"
 */
function formatDateFormal(dateObj) {
  const date = dateObj ? new Date(dateObj) : new Date();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate an Acknowledgement Letter PDF with Student Passport Photo captured at the top right corner
 * @param {Object} submission - Submission record with user, department, and submittedDocuments
 * @returns {Promise<Object>} { relativeUrl, fullPath }
 */
async function generateAcknowledgementPdf(submission) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions in points
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Color Palette
  const primaryColor = rgb(0.118, 0.227, 0.541); // #1e3a8a - Taraba State University Navy
  const textColor = rgb(0.122, 0.161, 0.216);    // #1f2937 - Dark Slate Body
  const grayColor = rgb(0.392, 0.455, 0.545);    // #64748b - Slate Gray
  const lightBg = rgb(0.961, 0.973, 0.988);     // #f8fafc
  const lineDivider = rgb(0.8, 0.85, 0.92);

  const student = submission.user || {};
  const departmentName = student.department?.name || 'Department of Computer Science';
  const refCode = submission.referenceNumber || 'DFOS-REF-PENDING';
  const issueDateStr = formatDateFormal(new Date());
  const submissionDateStr = formatDateFormal(submission.submittedAt || Date.now());

  const docs = submission.submittedDocuments || [];

  // 1. LOCATE STUDENT PASSPORT PHOTOGRAPH
  let passportDoc = docs.find((d) => {
    const typeName = d.documentType?.name?.toLowerCase() || '';
    return typeName.includes('passport');
  });

  let embeddedPassport = null;
  const passportPathCandidate = submission.user?.passportUrl || passportDoc?.filePath;

  if (passportPathCandidate) {
    const absolutePassportPath = path.isAbsolute(passportPathCandidate)
      ? passportPathCandidate
      : path.join(__dirname, '../../', passportPathCandidate);

    if (fs.existsSync(absolutePassportPath)) {
      try {
        const imageBytes = fs.readFileSync(absolutePassportPath);
        const mime = (passportDoc?.mimeType || '').toLowerCase();
        const ext = path.extname(absolutePassportPath).toLowerCase();

        if (mime.includes('png') || ext === '.png') {
          embeddedPassport = await pdfDoc.embedPng(imageBytes);
        } else if (mime.includes('jpeg') || mime.includes('jpg') || ext === '.jpg' || ext === '.jpeg') {
          embeddedPassport = await pdfDoc.embedJpg(imageBytes);
        }
      } catch (err) {
        console.error('Failed to embed passport photograph into PDF:', err);
      }
    }
  }

  let currentY = height - 50;

  // 2. INSTITUTIONAL LETTERHEAD BANNER
  page.drawText('TARABA STATE UNIVERSITY', {
    x: 40,
    y: currentY,
    size: 16,
    font: fontBold,
    color: primaryColor,
  });

  currentY -= 18;

  page.drawText('FACULTY OF COMPUTING AND ARTIFICIAL INTELLIGENCE', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });

  currentY -= 15;

  page.drawText(departmentName.toUpperCase(), {
    x: 40,
    y: currentY,
    size: 10,
    font: fontBold,
    color: textColor,
  });

  currentY -= 14;

  page.drawText('P.M.B. 1167, Jalingo, Taraba State, Nigeria • Portal: dfos.tsuniversity.edu.ng', {
    x: 40,
    y: currentY,
    size: 8,
    font: fontRegular,
    color: grayColor,
  });

  currentY -= 15;

  // Decorative Rule Line under Letterhead
  page.drawLine({
    start: { x: 40, y: currentY },
    end: { x: width - 40, y: currentY },
    thickness: 2,
    color: primaryColor,
  });

  // 3. TOP RIGHT CORNER STUDENT PASSPORT PHOTO FRAME
  const passportWidth = 75;
  const passportHeight = 90;
  const passportX = width - 40 - passportWidth;
  const passportY = currentY - 110;

  // Outer passport border frame
  page.drawRectangle({
    x: passportX - 2,
    y: passportY - 2,
    width: passportWidth + 4,
    height: passportHeight + 4,
    color: rgb(1, 1, 1),
    borderColor: primaryColor,
    borderWidth: 1.5,
  });

  if (embeddedPassport) {
    page.drawImage(embeddedPassport, {
      x: passportX,
      y: passportY,
      width: passportWidth,
      height: passportHeight,
    });
  } else {
    // Clean Placeholder frame when photo is not uploaded yet
    page.drawRectangle({
      x: passportX,
      y: passportY,
      width: passportWidth,
      height: passportHeight,
      color: rgb(0.95, 0.96, 0.98),
      borderColor: lineDivider,
      borderWidth: 0.5,
    });

    page.drawText('STUDENT', {
      x: passportX + 18,
      y: passportY + 52,
      size: 7.5,
      font: fontBold,
      color: grayColor,
    });

    page.drawText('PASSPORT', {
      x: passportX + 16,
      y: passportY + 40,
      size: 7.5,
      font: fontBold,
      color: grayColor,
    });

    page.drawText('PHOTO', {
      x: passportX + 23,
      y: passportY + 28,
      size: 7.5,
      font: fontBold,
      color: grayColor,
    });
  }

  currentY -= 25;

  // 4. DATE & REFERENCE ROW
  page.drawText(issueDateStr, {
    x: 40,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: textColor,
  });

  page.drawText(`Ref: ${refCode}`, {
    x: 40,
    y: currentY - 15,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });

  currentY -= 35;

  // 5. RECIPIENT BLOCK
  page.drawText(student.name || 'Student Name', {
    x: 40,
    y: currentY,
    size: 11,
    font: fontBold,
    color: textColor,
  });

  currentY -= 16;

  page.drawText(`Student ID / Matric No: ${student.matricNo || 'N/A'}`, {
    x: 40,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: textColor,
  });

  currentY -= 16;

  page.drawText(departmentName, {
    x: 40,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: textColor,
  });

  currentY -= 30;

  // 6. SUBJECT LINE
  page.drawText('Subject: Acknowledgment of Document Submission', {
    x: 40,
    y: currentY,
    size: 11,
    font: fontBold,
    color: primaryColor,
  });

  const subjectWidth = fontBold.widthOfTextAtSize('Subject: Acknowledgment of Document Submission', 11);
  page.drawLine({
    start: { x: 40, y: currentY - 3 },
    end: { x: 40 + subjectWidth, y: currentY - 3 },
    thickness: 1,
    color: primaryColor,
  });

  currentY -= 30;

  // 7. SALUTATION
  page.drawText(`Dear ${student.name || 'Student'},`, {
    x: 40,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: textColor,
  });

  currentY -= 25;

  // 8. PARAGRAPH 1 (CONFIRMATION)
  const paragraph1 = `This letter confirms that the ${departmentName} has successfully received your uploaded documents on ${submissionDateStr}.`;
  currentY = drawWrappedText(page, paragraph1, {
    x: 40,
    y: currentY,
    maxWidth: width - 80,
    fontSize: 10,
    font: fontRegular,
    color: textColor,
    lineHeight: 16,
  });

  currentY -= 20;

  // 9. SUBMITTED DOCUMENTS LIST
  page.drawText('Submitted Documents:', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });

  currentY -= 20;

  if (docs.length === 0) {
    page.drawText('• No documents attached yet.', {
      x: 55,
      y: currentY,
      size: 9,
      font: fontOblique,
      color: grayColor,
    });
    currentY -= 20;
  } else {
    docs.forEach((doc, idx) => {
      const docTypeName = doc.documentType?.name || `Document ${idx + 1}`;
      const docFileName = doc.fileName ? ` (${doc.fileName})` : '';
      const docLine = `• [${idx + 1}] ${docTypeName}${docFileName}`;

      currentY = drawWrappedText(page, docLine, {
        x: 55,
        y: currentY,
        maxWidth: width - 110,
        fontSize: 9.5,
        font: fontRegular,
        color: textColor,
        lineHeight: 15,
      });
      currentY -= 4;
    });
  }

  currentY -= 20;

  // 10. PARAGRAPH 2 (ADMINISTRATIVE REVIEW)
  const paragraph2 = `Our administrative team is currently reviewing your file to ensure all submitted items meet the necessary requirements. Should any additional information or clarification be needed, we will reach out to you directly via your registered email address (${student.email || 'N/A'}).`;
  currentY = drawWrappedText(page, paragraph2, {
    x: 40,
    y: currentY,
    maxWidth: width - 80,
    fontSize: 10,
    font: fontRegular,
    color: textColor,
    lineHeight: 16,
  });

  currentY -= 20;

  // 11. PARAGRAPH 3 (CONTACT INFO)
  const contactInfo = `If you have any questions regarding the status of your verification, please feel free to contact the departmental administrative office at support.dfos@tsuniversity.edu.ng referencing your Student ID Number (${student.matricNo || refCode}).`;
  currentY = drawWrappedText(page, contactInfo, {
    x: 40,
    y: currentY,
    maxWidth: width - 80,
    fontSize: 10,
    font: fontRegular,
    color: textColor,
    lineHeight: 16,
  });

  currentY -= 25;

  // 12. CLOSING
  page.drawText('Thank you for your cooperation.', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: textColor,
  });

  currentY -= 30;

  page.drawText('Sincerely,', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: textColor,
  });

  currentY -= 45;

  // 13. SIGNATURE & DESK OFFICER BLOCK
  page.drawLine({
    start: { x: 40, y: currentY + 15 },
    end: { x: 220, y: currentY + 15 },
    thickness: 1,
    color: grayColor,
  });

  page.drawText('Admissions & Verification Desk Officer', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontBold,
    color: textColor,
  });

  currentY -= 15;

  page.drawText('Admissions/Administrative Coordinator', {
    x: 40,
    y: currentY,
    size: 9.5,
    font: fontRegular,
    color: textColor,
  });

  currentY -= 15;

  page.drawText(departmentName, {
    x: 40,
    y: currentY,
    size: 9.5,
    font: fontBold,
    color: primaryColor,
  });

  currentY -= 15;

  page.drawText('Taraba State University', {
    x: 40,
    y: currentY,
    size: 9.5,
    font: fontBold,
    color: textColor,
  });

  // 14. FOOTER
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 35,
    color: lightBg,
    borderColor: lineDivider,
    borderWidth: 1,
  });

  page.drawText(`Digital File Opening System (DFOS) • Taraba State University • Ref: ${refCode} • Generated: ${new Date().toISOString()}`, {
    x: 40,
    y: 13,
    size: 7.5,
    font: fontRegular,
    color: grayColor,
  });

  // Save PDF file to /uploads/acknowledgements
  const uploadsDir = path.join(__dirname, '../../uploads/acknowledgements');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const pdfFileName = `acknowledgement_${submission.id}_${Date.now()}.pdf`;
  const fullPath = path.join(uploadsDir, pdfFileName);
  const pdfBytes = await pdfDoc.save();

  fs.writeFileSync(fullPath, pdfBytes);

  const relativeUrl = `/uploads/acknowledgements/${pdfFileName}`;
  return { relativeUrl, fullPath };
}

module.exports = {
  generateAcknowledgementPdf,
};
