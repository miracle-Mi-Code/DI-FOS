import api from '../services/api';

/**
 * Authenticated helper to fetch and download/preview Acknowledgement PDF
 */
export async function downloadAcknowledgementPdf(submissionId, referenceNumber = 'DFOS') {
  try {
    const response = await api.get(`/submissions/${submissionId}/acknowledgement`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);

    // Open PDF in new browser tab
    window.open(blobUrl, '_blank');

    // Trigger instant local download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Acknowledgement_${referenceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Failed to download acknowledgement PDF via blob, trying token query fallback:', error);
    const token = localStorage.getItem('dfos_token');
    const fallbackUrl = `/api/submissions/${submissionId}/acknowledgement?token=${token}`;
    window.open(fallbackUrl, '_blank');
  }
}
