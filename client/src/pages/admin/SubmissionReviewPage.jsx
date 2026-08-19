import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import { downloadAcknowledgementPdf } from '../../utils/download';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Building,
  User,
  Phone,
  Mail,
  Clock,
  Send,
  MessageSquare,
  AlertCircle,
  Download,
} from 'lucide-react';
import Toast from '../../components/Toast';

export const SubmissionReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Document Review inline comments
  const [comments, setComments] = useState({});
  const [reviewingDocId, setReviewingDocId] = useState(null);

  // Overall status update
  const [overallStatus, setOverallStatus] = useState('');
  const [overallComment, setOverallComment] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Preview Modal
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fetchSubmissionDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/submissions/${id}`);
      setSubmission(res.data.submission);
      setOverallStatus(res.data.submission?.status || 'PENDING');
    } catch (err) {
      setToast({ message: 'Failed to load submission details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionDetail();
  }, [id]);

  const handleReviewDocument = async (docId, newStatus) => {
    setReviewingDocId(docId);
    try {
      const commentText = comments[docId] || '';
      await api.patch(`/admin/documents/${docId}`, {
        status: newStatus,
        reviewComment: commentText,
      });

      setToast({ message: `Document status marked as ${newStatus}.`, type: 'success' });
      fetchSubmissionDetail();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to update document.', type: 'error' });
    } finally {
      setReviewingDocId(null);
    }
  };

  const handleUpdateOverallStatus = async (e) => {
    e.preventDefault();
    setSubmittingStatus(true);
    try {
      await api.patch(`/admin/submissions/${id}/status`, {
        status: overallStatus,
        comment: overallComment,
      });

      setToast({
        message: `Submission status updated to ${overallStatus.replace('_', ' ')}. SMS & Email alerts sent!`,
        type: 'success',
      });
      fetchSubmissionDetail();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to update submission status.', type: 'error' });
    } finally {
      setSubmittingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-brand-700 font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 animate-spin" /> Loading submission review workspace...
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-slate-600 font-bold">Submission record not found.</p>
      </div>
    );
  }

  const student = submission.user || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Submissions Queue
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Ref Code:</span>
          <span className="text-sm font-extrabold text-brand-900 bg-brand-50 px-3 py-1 rounded-lg border border-brand-200">
            {submission.referenceNumber || 'DFOS-DRAFT'}
          </span>
          <StatusBadge status={submission.status} size="sm" />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Student Details Card & Status Updater */}
        <div className="space-y-6">
          {/* Student Profile Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-4 pb-3 border-b border-slate-200">
              Student Info Profile
            </h3>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-brand-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Full Name</p>
                  <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Matriculation No.</p>
                  <p className="font-bold text-slate-900">{student.matricNo || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-brand-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Department</p>
                  <p className="font-bold text-slate-900">{student.department?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Email Address</p>
                  <p className="font-bold text-slate-900">{student.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Phone (SMS Alert)</p>
                  <p className="font-bold text-slate-900">{student.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Decision Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-4 pb-3 border-b border-slate-200">
              Department Final Decision
            </h3>

            <form onSubmit={handleUpdateOverallStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Overall Status Decision
                </label>
                <select
                  value={overallStatus}
                  onChange={(e) => setOverallStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-600 outline-none"
                >
                  <option value="PENDING">Pending Review</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">APPROVED (Verified)</option>
                  <option value="REJECTED">REJECTED (Action Required)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notification Comment / Note
                </label>
                <textarea
                  rows={3}
                  value={overallComment}
                  onChange={(e) => setOverallComment(e.target.value)}
                  placeholder="Explain decision or missing document requirements to student..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-brand-600 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingStatus}
                className="w-full py-3 bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingStatus ? 'Updating Status...' : 'Save Decision & Send SMS/Email'}
              </button>
            </form>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
              Status History Log
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              {submission.statusHistories?.map((h) => (
                <div key={h.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-brand-900">{h.oldStatus} &rarr; {h.newStatus}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    By: {h.changer?.name} • {new Date(h.changedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Submitted Documents Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">
                Uploaded Document Review Workspace ({submission.submittedDocuments?.length || 0} Files)
              </h3>

              {submission.acknowledgementPdfUrl && (
                <button
                  onClick={() => downloadAcknowledgementPdf(submission.id, submission.referenceNumber || 'DFOS')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300"
                >
                  <Download className="w-3.5 h-3.5" /> Preview Acknowledgement PDF
                </button>
              )}
            </div>

            <div className="space-y-6">
              {submission.submittedDocuments?.map((doc) => {
                const isApproved = doc.status === 'APPROVED';
                const isRejected = doc.status === 'REJECTED';
                const isUpdating = reviewingDocId === doc.id;

                return (
                  <div
                    key={doc.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isApproved
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : isRejected
                        ? 'bg-rose-50/40 border-rose-300'
                        : 'bg-slate-50/80 border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Document Type
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {doc.documentType?.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Filename: <code>{doc.fileName}</code>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDocForPreview(doc);
                            setShowPreviewModal(true);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-brand-900 font-bold text-xs rounded-lg border border-slate-300 flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview Document
                        </button>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                    </div>

                    {/* Staff Comment Input & Review Switches */}
                    <div className="pt-3 border-t border-slate-200/80 space-y-3">
                      <div>
                        <input
                          type="text"
                          value={comments[doc.id] !== undefined ? comments[doc.id] : doc.reviewComment || ''}
                          onChange={(e) => setComments({ ...comments, [doc.id]: e.target.value })}
                          placeholder="Add comment or feedback for student if rejecting..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-600 outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReviewDocument(doc.id, 'REJECTED')}
                          disabled={isUpdating}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject Document
                        </button>

                        <button
                          onClick={() => handleReviewDocument(doc.id, 'APPROVED')}
                          disabled={isUpdating}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve Document
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <DocumentViewerModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        document={selectedDocForPreview}
      />
    </div>
  );
};

export default SubmissionReviewPage;
