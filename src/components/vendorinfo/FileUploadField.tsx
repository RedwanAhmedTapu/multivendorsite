import { VendorDocument } from "@/features/vendorManageApi";
import { useEffect, useState } from "react";

const FileUploadField: React.FC<{
  label: string;
  accept: string;
  file: File | undefined;
  onChange: (file: File | null) => void;
  onUpload: () => void;
  onDelete: () => void;
  required?: boolean;
  description?: string;
  error?: boolean;
  existingDocument?: VendorDocument;
  isUploading?: boolean;
  isDeleting?: boolean;
}> = ({ 
  label, 
  accept, 
  file, 
  onChange, 
  onUpload,
  onDelete,
  required = false, 
  description, 
  error = false, 
  existingDocument,
  isUploading = false,
  isDeleting = false
}) => {
  const [localFile, setLocalFile] = useState<File | undefined>(file);

  useEffect(() => {
    setLocalFile(file);
  }, [file]);

  const handleFileSelect = (selectedFile: File | null) => {
    setLocalFile(selectedFile || undefined);
    onChange(selectedFile);
  };

  const handleUploadClick = () => {
    if (localFile) {
      onUpload();
    }
  };

  const handleDeleteClick = () => {
    if (existingDocument) {
      onDelete();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={`block text-sm font-medium ${error ? 'text-red-700' : 'text-gray-700'}`}>
          {label} {required && <span className="text-red-500">*</span>}
          {!required && <span className="text-gray-400 text-xs ml-1">(Optional)</span>}
        </label>
        {existingDocument && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            existingDocument.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
            existingDocument.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
            existingDocument.verificationStatus === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {existingDocument.verificationStatus.replace('_', ' ').toLowerCase()}
          </span>
        )}
      </div>
      
      {description && (
        <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-500'} mb-2`}>{description}</p>
      )}
      
      {existingDocument && !localFile && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-green-700 font-medium">Document uploaded</p>
                <p className="text-xs text-green-600 truncate">{existingDocument.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
              title="Delete document"
            >
              {isDeleting ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
      
      <div className="flex gap-2">
        <input
          type="file"
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          className={`block w-full text-sm ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
            error ? 'file:bg-red-50 file:text-red-700 hover:file:bg-red-100' : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
          }`}
        />
        {localFile && (
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </button>
        )}
      </div>
      
      {localFile && (
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center ${error ? 'text-red-600' : 'text-green-600'}`}>
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{localFile.name}</span>
          </div>
          <span className="text-gray-500 ml-2">{(localFile.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      )}
      
      {existingDocument && localFile && (
        <p className="text-xs text-orange-600">
          ⚠️ Uploading this file will replace the existing document
        </p>
      )}
    </div>
  );
};

export default FileUploadField;