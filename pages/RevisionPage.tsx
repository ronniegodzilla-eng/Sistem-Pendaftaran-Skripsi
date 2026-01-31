
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, Save, Loader2, Search, User, AlertCircle, X, CheckCircle } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { FileRequirement, SubmissionState, Student, ValidationItem } from '../types';
import { uploadFileToDrive } from '../services/driveService';
import { searchStudentsByName } from '../services/studentService';
import { db } from '../services/mockDb';

interface RevisionPageProps {
  title: string;
  requirements: FileRequirement[];
  onBack: () => void;
  type: 'proposal' | 'skripsi';
}

export const RevisionPage: React.FC<RevisionPageProps> = ({ 
  title, 
  requirements, 
  onBack,
  type
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [files, setFiles] = useState<SubmissionState>({});
  const [validations, setValidations] = useState<{[key: string]: ValidationItem}>({});
  const [uploadingStatus, setUploadingStatus] = useState<{[key: string]: boolean}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setSearchError('');
    if (student) {
        setStudent(null);
        setFiles({});
        setValidations({});
    }
    if (value.length >= 3) {
      setIsSearching(true);
      try {
        const results = await searchStudentsByName(value);
        setSuggestions(results);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectStudent = async (selected: Student) => {
      setStudent(selected);
      setSearchInput(selected.nama);
      setSuggestions([]);
      setSearchError('');

      const existing = await db.getSubmissionByNpm(selected.npm, type);
      
      if (!existing) {
          setSearchError('Anda belum mendaftar tahap ini.');
          setStudent(null);
          return;
      }

      const allowedStatus = type === 'proposal' ? 'revision_proposal_pending' : 'revision_skripsi_pending';

      if (existing.status !== allowedStatus) {
          setSearchError('Anda belum dinyatakan lulus sidang/seminar atau revisi sudah selesai.');
          setStudent(null);
          return;
      }

      const revFileKeys = requirements.map(r => r.id);
      const relevantFiles: SubmissionState = {};
      revFileKeys.forEach(key => {
          if (existing.files[key]) relevantFiles[key] = existing.files[key];
      });
      setFiles(relevantFiles);
      setValidations(existing.validations || {});
  };

  const clearSelection = () => {
      setStudent(null);
      setSearchInput('');
      setFiles({});
      setValidations({});
      setSuggestions([]);
      setSearchError('');
  };

  const handleUpload = async (id: string, file: File) => {
    setUploadingStatus(prev => ({ ...prev, [id]: true }));
    try {
      const driveResult = await uploadFileToDrive(file);
      setFiles(prev => ({
        ...prev,
        [id]: {
          file,
          previewUrl: URL.createObjectURL(file),
          driveId: driveResult.id,
          driveUrl: driveResult.webViewLink
        }
      }));
    } catch (error) {
      alert("Gagal mengupload ke Google Drive.");
    } finally {
      setUploadingStatus(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleRemove = (id: string) => {
    setFiles(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const isComplete = requirements.every(r => !!files[r.id]);
  const isAnyUploading = Object.values(uploadingStatus).some(status => status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || !student) return;

    setIsSubmitting(true);
    
    const existing = await db.getSubmissionByNpm(student.npm, type);
    if(existing) {
        await db.submitRevision(existing.id, files);
    }
    
    setIsSubmitting(false);
    setSubmitted(true);
    window.scrollTo(0, 0);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Revisi Berhasil Dikirim!</h2>
        <p className="text-slate-600 max-w-md mb-8">
          File revisi Anda telah dikirim. Admin Pustaka akan memverifikasi berkas Anda.
        </p>
        <button onClick={onBack} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-slate-200 text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
         <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <User className="mr-2 text-indigo-600" size={20} /> Identitas Mahasiswa
          </h2>
          <div className="max-w-xl" ref={searchContainerRef}>
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {isSearching ? <Loader2 className="animate-spin text-slate-400" size={18}/> : <Search className="text-slate-400" size={18}/>}
                  </div>
                  <input 
                      type="text" 
                      value={searchInput}
                      onChange={handleSearchChange}
                      disabled={!!student}
                      placeholder="Cari Nama untuk upload revisi..."
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  {student && (
                      <button onClick={clearSelection} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                          <X size={18} />
                      </button>
                  )}
                  {!student && suggestions.length > 0 && (
                      <div className="absolute z-50 w-full bg-white mt-1 border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {suggestions.map((s) => (
                              <button key={s.npm} onClick={() => handleSelectStudent(s)} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                                  <p className="font-medium text-slate-900 text-sm">{s.nama}</p>
                                  <p className="text-xs text-slate-500">{s.npm} • {s.prodi}</p>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
              {searchError && (
                <div className="mt-3 text-red-600 text-sm flex items-center bg-red-50 p-2 rounded border border-red-100"><AlertCircle size={16} className="mr-2" /> {searchError}</div>
              )}
          </div>
      </div>

      {student && !searchError && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-6">
              {requirements.map((req) => {
                const isValid = validations[req.id]?.isValid;
                const notes = validations[req.id]?.notes;
                return (
                  <div key={req.id} className="relative">
                      {isValid === true && (
                          <div className="mb-2 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                              <CheckCircle size={18} /><div className="text-sm font-bold">Berkas Disetujui</div>
                          </div>
                      )}
                      {isValid === false && (
                          <div className="mb-2 flex flex-col gap-1 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                              <div className="flex items-center gap-2 font-bold text-sm"><AlertCircle size={18} />Perlu Perbaikan</div>
                              {notes && <p className="text-sm ml-6 text-slate-700">"{notes}"</p>}
                          </div>
                      )}
                      {isValid === true ? (
                          <div className="opacity-70 pointer-events-none grayscale"><FileUpload {...req} uploadedFile={files[req.id] || null} onUpload={()=>{}} onRemove={()=>{}} isUploading={false}/></div>
                      ) : (
                          <FileUpload {...req} uploadedFile={files[req.id] || null} onUpload={handleUpload} onRemove={handleRemove} isUploading={uploadingStatus[req.id]}/>
                      )}
                  </div>
                );
              })}
            </div>
            
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end items-center space-x-4">
              <button type="submit" disabled={!isComplete || isSubmitting || isAnyUploading} className="flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                {isSubmitting ? <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />Processing...</> : <><Save size={18} /><span>Kirim Revisi</span></>}
              </button>
            </div>
          </form>
      )}
    </div>
  );
};
