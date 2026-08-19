const pdfService = require('./src/services/pdfService');

async function testPdf() {
  const dummySubmission = {
    id: 'test-sub-123',
    referenceNumber: 'DFOS-2026-TEST99',
    submittedAt: new Date(),
    status: 'APPROVED',
    user: {
      name: 'John Doe',
      matricNo: 'CSC/2026/001',
      email: 'john.doe@dfos.tsuniversity.edu.ng',
      phone: '08012345678',
      department: {
        name: 'Department of Computer Science',
      },
    },
    submittedDocuments: [
      { documentType: { name: "Senior Secondary School Certificate (O'Level / WAEC)" }, fileName: 'olevel_result.pdf', status: 'APPROVED' },
      { documentType: { name: 'Official Provisional Admission Letter' }, fileName: 'admission_letter.pdf', status: 'APPROVED' },
      { documentType: { name: 'Birth Certificate / Declaration of Age' }, fileName: 'birth_cert.jpg', status: 'APPROVED' },
    ],
  };

  try {
    const result = await pdfService.generateAcknowledgementPdf(dummySubmission);
    console.log('✅ PDF Generated Successfully:', result);
  } catch (err) {
    console.error('❌ Failed to generate PDF:', err);
  }
}

testPdf();
