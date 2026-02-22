import React, { useRef } from 'react';
import { Upload, CheckCircle, FileText, X, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { UploadedFile, ValidationItem } from '../types';

interface FileUploadProps {
  id: string;
  label: string;
  description?: string;
  acceptedTypes?: string;
  uploadedFile: UploadedFile | null;
  onUpload: (id: string, file: File) => void;
  onRemove: (id: string) => void;
  required?: boolean;
  isUploading?: boolean;
  validation?: ValidationItem;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  id,
  label,
  description,
  acceptedTypes = ".pdf,.jpg,.jpeg,.png",
  uploadedFile,
  onUpload,
  onRemove,
  required,
  isUploading = false,
  validation
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isRejected = validation?.isValid === false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(id, e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(id, e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`mb-6 ${isRejected ? 'p-4 bg-red-50/30 border border-red-200 rounded-xl' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {uploadedFile && !isUploading && !isRejected && (
          <span className="text-xs flex items-center text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-100">
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-3 h-3 mr-1.5" alt="Drive" />
            Tersimpan di Drive
          </span>
        )}
        {isUploading && (
           <span className="text-xs flex items-center text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full animate-pulse">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...
          </span>
        )}
      </div>

      {isRejected && (
        <div className="mb-4 flex flex-col gap-1 text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle size={16} />
                Berkas Ditolak
            </div>
            <p className="text-sm ml-6">{validation.notes}</p>
        </div>
      )}
      
      {!uploadedFile && !isUploading ? (
        <div
          className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-indigo-500 hover:bg-slate-50 transition-colors cursor-pointer group"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <div className="flex text-sm text-slate-600 justify-center">
              <span className="relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                Upload file
              </span>
              <p className="pl-1">atau drag & drop</p>
            </div>
            <p className="text-xs text-slate-500">
              {description ? description : `File tipe: ${acceptedTypes.replace(/\./g, ' ').toUpperCase()}`}
            </p>
          </div>
        </div>
      ) : (
        <div className={`mt-1 flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm ${isUploading ? 'border-blue-200 bg-blue-50/50' : isRejected ? 'border-red-300' : 'border-slate-200'}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className={`flex-shrink-0 h-10 w-10 rounded flex items-center justify-center ${isUploading ? 'bg-blue-100' : isRejected ? 'bg-red-100' : 'bg-indigo-50'}`}>
              {isUploading ? (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              ) : (
                <FileText className={`h-6 w-6 ${isRejected ? 'text-red-600' : 'text-indigo-600'}`} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">
                {uploadedFile?.file?.name || (uploadedFile as any)?.name || "Berkas Tersimpan"}
              </p>
              <p className="text-xs text-slate-500">
                {uploadedFile?.file ? (uploadedFile.file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Tersimpan di sistem'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isUploading && uploadedFile?.driveUrl && (
              <a 
                href={uploadedFile.driveUrl} 
                target="_blank" 
                rel="noreferrer"
                title="Lihat di Google Drive"
                className="p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
            {isRejected ? (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); inputRef.current?.click(); }}
                disabled={isUploading}
                className="ml-2 px-4 py-1.5 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                Perbaiki
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onRemove(id)}
                disabled={isUploading}
                className="ml-2 flex-shrink-0 p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        name={id}
        type="file"
        accept={acceptedTypes}
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
};