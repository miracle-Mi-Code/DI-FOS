import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import { downloadAcknowledgementPdf } from '../../utils/download';
import {
  Upload,
  FileCheck,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Download,
  ArrowLeft,
  FileText,
  Clock,
  Send,
  AlertTriangle,
  Info,
} from 'lucide-react';
import Toast from '../../components/Toast';

export const DocumentUploadPage = () => {
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [requiredDocs, setRequiredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Preview Modal
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Finalize Submission Modal
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user's active submission
      const subRes = await api.post('/submissions');
      setSubmission(subRes.data.submission);

      // 2. Fetch required documents checklist
      const reqRes = await api.get('/documents/required');
      setRequiredDocs(reqRes.data.requiredDocuments || []);
    } catch (err) {
      setToast({ message: 'Failed to load document checklist.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Find uploaded doc by documentTypeId
  const getUploadedDoc = (docTypeId) => {
    if (!submission?.submittedDocuments) return null;
    return submission.submittedDocuments.find((d) => d.documentTypeId === docTypeId);
  };

  const handleFileUpload = async (docTypeId, file) => {
    if (!file) return;

    // Validate size
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'File size exceeds maximum allowed limit of 5MB.', type: 'error' });
      return;
    }

    // Validate mime type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setToast({ message: 'Invalid file format. Please upload PDF, JPG, or PNG files.', type: 'error' });
      return;
    }

    setUploadingDocId(docTypeId);
    setToast({ message: 'Uploading document file...', type: 'info' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentTypeId', docTypeId);

      await api.post(`/submissions/${submission.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setToast({ message: 'Document uploaded successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to upload file.', type: 'error' });
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleDeleteDoc = async (submittedDocId) => {
    if (!window.confirm('Are you sure you want to remove this uploaded document?')) return;

    try {
      await api.delete(`/submissions/${submission.id}/documents/${submittedDocId}`);
      setToast({ message: 'Document removed.', type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to delete document.', type: 'error' });
    }
  };

  const handleFinalizeSubmission = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/submissions/${submission.id}/submit`);
      setShowSubmitConfirmModal(false);
      setToast({ message: 'File submission finalized! Acknowledgement PDF generated.', type: 'success' });
      fetchData();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to finalize submission.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Mandatory documents check
  const mandatoryDocs = requiredDocs.filter((d) => d.isMandatory);
  const uploadedDocTypeIds = (submission?.submittedDocuments || []).map((d) => d.documentTypeId);
  const missingMandatoryCount = mandatoryDocs.filter((d) => !uploadedDocTypeIds.includes(d.id)).length;
  const isReadyToSubmit = missingMandatoryCount === 0;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-brand-700 font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 animate-spin" /> Loading checklist...
        </div>
      </div>
    );
  }

  const isSubmittedOrApproved = submission?.status === 'PENDING' || submission?.status === 'UNDER_REVIEW' || submission?.status === 'APPROVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Submission Ref:</span>
          <span className="text-sm font-extrabold text-brand-900 bg-brand-50 px-3 py-1 rounded-lg border border-brand-200">
            {submission?.referenceNumber || 'DFOS-DRAFT'}
          </span>
          <StatusBadge status={submission?.status} size="sm" />
        </div>
      </div>

      {/* Main Title Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Required Documents Checklist
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Upload clear PDF scans or images of your official credentials. All mandatory slots must be completed.
            </p>
          </div>

          {!isSubmittedOrApproved && (
            <button
              onClick={() => setShowSubmitConfirmModal(true)}
              disabled={!isReadyToSubmit}
              className={`px-6 py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-all ${
                isReadyToSubmit
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" /> Finalize File Submission
            </button>
          )}

          {isSubmittedOrApproved && submission?.acknowledgementPdfUrl && (
            <button
              onClick={() => downloadAcknowledgementPdf(submission.id, submission.referenceNumber || 'DFOS')}
              className="px-5 py-3 bg-brand-900 hover:bg-brand-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Download Acknowledgement PDF
            </button>
          )}
        </div>

        {/* Mandatory Completion Indicator Banner */}
        {!isSubmittedOrApproved && (
          <div
            className={`mt-6 p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              isReadyToSubmit
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isReadyToSubmit ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <span>
                {isReadyToSubmit
                  ? 'All mandatory documents uploaded! You can now finalize your submission.'
                  : `Missing ${missingMandatoryCount} mandatory document slot(s). Please complete uploads before submitting.`}
              </span>
            </div>
            <span className="font-bold">
              {uploadedDocTypeIds.length} / {requiredDocs.length} Uploaded
            </span>
          </div>
        )}
      </div>

      {/* Documents Grid */}
      <div className="space-y-4">
        {requiredDocs.map((reqDoc) => {
          const uploaded = getUploadedDoc(reqDoc.id);
          const isUploading = uploadingDocId === reqDoc.id;

          return (
            <div
              key={reqDoc.id}
              className={`bg-white rounded-2xl p-5 border transition-all ${
                uploaded
                  ? uploaded.status === 'REJECTED'
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200'
                  : reqDoc.isMandatory
                  ? 'border-slate-300 hover:border-brand-300'
                  : 'border-slate-200 opacity-90'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Info Column */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{reqDoc.name}</h3>
                    {reqDoc.isMandatory ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase rounded-md tracking-wider">
                        Mandatory
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase rounded-md tracking-wider">
                        Optional
                      </span>
                    )}
                  </div>
                  {reqDoc.description && (
                    <p className="text-xs text-slate-500 mt-1">{reqDoc.description}</p>
                  )}

                  {/* Rejection comment display */}
                  {uploaded && uploaded.status === 'REJECTED' && uploaded.reviewComment && (
                    <div className="mt-2 p-3 bg-rose-100/70 border border-rose-300 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Staff Feedback:</strong> "{uploaded.reviewComment}"
                        <p className="mt-0.5 text-[11px] font-semibold text-rose-800">
                          Please re-upload a clear replacement file below.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Upload / Action Column */}
                <div className="shrink-0 flex items-center gap-3">
                  {uploaded ? (
                    <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <FileText className="w-8 h-8 text-brand-600" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 max-w-[180px] truncate">
                          {uploaded.fileName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              uploaded.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : uploaded.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {uploaded.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {(uploaded.fileSize / 1024).toFixed(0)} KB
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <button
                        onClick={() => {
                          setSelectedDocForPreview(uploaded);
                          setShowPreviewModal(true);
                        }}
                        className="p-2 text-slate-500 hover:text-brand-700 hover:bg-white rounded-lg transition-colors border border-slate-200"
                        title="Preview File"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {(!isSubmittedOrApproved || uploaded.status === 'REJECTED') && (
                        <button
                          onClick={() => handleDeleteDoc(uploaded.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className="relative cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200 rounded-xl text-xs font-bold transition-all shadow-sm">
                      <Upload className="w-4 h-4 text-brand-600" />
                      <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        disabled={isUploading}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(reqDoc.id, e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal Component */}
      <DocumentViewerModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        document={selectedDocForPreview}
      />

      {/* Finalize Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Finalize File Submission?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                By submitting, your documents will be locked for review by the academic department board, and an official <strong>Acknowledgement Letter (PDF)</strong> will be generated.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalizeSubmission}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                {submitting ? 'Submitting...' : 'Yes, Confirm & Submit File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadPage;
