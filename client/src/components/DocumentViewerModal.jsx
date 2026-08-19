import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';

export const DocumentViewerModal = ({ isOpen, onClose, document }) => {
  if (!isOpen || !document) return null;

  const fileUrl = document.fileUrl ? (document.fileUrl.startsWith('http') ? document.fileUrl : document.fileUrl) : '';
  const isPdf = document.mimeType === 'application/pdf' || fileUrl.endsWith('.pdf');
  const isImage = document.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(fileUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {document.documentType?.name || 'Document Preview'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              File: {document.fileName || 'uploaded_document'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 bg-slate-100 p-4 overflow-auto flex items-center justify-center min-h-[450px]">
          {isPdf ? (
            <iframe
              src={fileUrl}
              className="w-full h-[650px] border-0 rounded-lg bg-white shadow-sm"
              title="PDF Preview"
            />
          ) : isImage ? (
            <img
              src={fileUrl}
              alt={document.fileName}
              className="max-w-full max-h-[650px] object-contain rounded-lg shadow-md border border-slate-200"
            />
          ) : (
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 max-w-md">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Preview not available for this file type.</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-900 text-white font-medium rounded-lg hover:bg-brand-800 transition-colors text-xs"
              >
                <ExternalLink className="w-4 h-4" /> Open File Externally
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
