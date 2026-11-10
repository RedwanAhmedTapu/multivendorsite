import { VendorDocument } from "@/features/vendorManageApi";
import { getFileUrl } from "@/lib/media";
import { useEffect, useState } from "react";

const statusStyle: Record<string, { bg: string; fg: string }> = {
  APPROVED: { bg: '#f0fdf4', fg: '#15803d' },
  REJECTED: { bg: '#fef2f2', fg: '#dc2626' },
  UNDER_REVIEW: { bg: '#eef2ff', fg: '#4338ca' },
  PENDING: { bg: '#f1f5f9', fg: '#475569' },
};

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
const isImagePath = (path?: string): boolean => {
  if (!path) return false;
  const ext = path.split('?')[0].split('.').pop()?.toLowerCase();
  return !!ext && IMAGE_EXTENSIONS.includes(ext);
};

/* ── Fixed-size clickable thumbnail ── */
const Thumbnail: React.FC<{ src: string; onClick: () => void; size?: number }> = ({ src, onClick, size = 72 }) => (
  <button
    type="button"
    onClick={onClick}
    className="relative group flex-shrink-0 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-all"
    style={{ width: size, height: size }}
    title="Click to view full size"
  >
    <img src={src} alt="Document preview" className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
      <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    </div>
  </button>
);

/* ── Fullscreen preview modal (fixed-size, centered) ── */
const PreviewModal: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-6" onClick={onClose}>
      <div
        className="relative bg-[#111] rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: 'min(85vw, 900px)', height: 'min(85vh, 650px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="w-full h-full flex items-center justify-center p-4">
          <img src={src} alt="Full size document" className="max-w-full max-h-full object-contain" />
        </div>
      </div>
    </div>
  );
};

const SpinnerIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const FileUploadField: React.FC<{
  label: string;
  accept: string;
  file: File | undefined;
  onChange: (file: File | null) => void;
  onDelete: () => void;
  required?: boolean;
  description?: string;
  error?: boolean;
  existingDocument?: VendorDocument;
  isDeleting?: boolean;
}> = ({
  label,
  accept,
  file,
  onChange,
  onDelete,
  required = false,
  description,
  error = false,
  existingDocument,
  isDeleting = false,
}) => {
  const [localFile, setLocalFile] = useState<File | undefined>(file);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [modalSrc, setModalSrc] = useState<string | null>(null);

  useEffect(() => {
    setLocalFile(file);
  }, [file]);

  // নতুন selected image-এর জন্য instant local preview
  useEffect(() => {
    if (localFile && localFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(localFile);
      setLocalPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setLocalPreviewUrl(null);
  }, [localFile]);

  const handleFileSelect = (selectedFile: File | null) => {
    setLocalFile(selectedFile || undefined);
    onChange(selectedFile);
  };

  const handleDeleteClick = () => {
    if (existingDocument) onDelete();
  };

  const badge = existingDocument
    ? statusStyle[existingDocument.verificationStatus] || statusStyle.PENDING
    : null;

  const existingUrl = getFileUrl(existingDocument?.filePath);
  const existingIsImage = isImagePath(existingDocument?.filePath);

  return (
    <div
      className={`rounded-2xl border-2 p-4 space-y-3 transition-all ${error ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}
      style={{ backgroundColor: error ? undefined : '#faf8ff' }}
    >
      <div className="flex items-center justify-between gap-2">
        <label className={`text-xs font-black uppercase tracking-widest ${error ? 'text-red-600' : 'text-slate-600'}`}>
          {label} {required && <span className="text-red-500 normal-case">*</span>}
          {!required && <span className="text-slate-400 text-[10px] normal-case ml-1">(Optional)</span>}
        </label>
        {existingDocument && badge && !localFile && (
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ backgroundColor: badge.bg, color: badge.fg }}
          >
            {existingDocument.verificationStatus.replace('_', ' ').toLowerCase()}
          </span>
        )}
        {localFile && !existingDocument && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap bg-amber-50 text-amber-600">
            selected, not saved yet
          </span>
        )}
      </div>

      {description && <p className={`text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>{description}</p>}

      {/* Already-saved document */}
      {existingDocument && !localFile && (
        <div className="p-3 bg-white border border-green-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {existingIsImage ? (
              <Thumbnail src={existingUrl} onClick={() => setModalSrc(existingUrl)} />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-slate-700 font-bold">Document uploaded</p>
              <p className="text-xs text-slate-500 truncate">{existingDocument.title}</p>
              {existingIsImage && (
                <button type="button" onClick={() => setModalSrc(existingUrl)} className="text-[10px] text-blue-600 font-semibold hover:underline mt-0.5">
                  View full size
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            title="Delete document"
          >
            {isDeleting ? <SpinnerIcon /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* File picker — শুধু select করবে, সাথে সাথে upload হবে না */}
      <input
        type="file"
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
        className={`block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold transition-colors ${
          error ? 'file:bg-red-100 file:text-red-700 hover:file:bg-red-200' : 'file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200'
        }`}
      />

      {/* নতুন selected file preview */}
      {localFile && (
        <div className="flex items-center gap-3">
          {localPreviewUrl ? (
            <Thumbnail src={localPreviewUrl} onClick={() => setModalSrc(localPreviewUrl)} />
          ) : (
            <div className={`flex items-center gap-1.5 ${error ? 'text-red-600' : 'text-green-600'} min-w-0`}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0 flex items-center justify-between text-xs">
            <span className={`truncate ${error ? 'text-red-600' : 'text-slate-600'}`}>{localFile.name}</span>
            <span className="text-slate-400 ml-2 flex-shrink-0">{(localFile.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
      )}

      {existingDocument && localFile && (
        <p className="text-xs text-amber-600 font-medium">⚠️ Save & Continue চাপলে এটা আগের ডকুমেন্ট replace করবে</p>
      )}

      {modalSrc && <PreviewModal src={modalSrc} onClose={() => setModalSrc(null)} />}
    </div>
  );
};

export default FileUploadField;