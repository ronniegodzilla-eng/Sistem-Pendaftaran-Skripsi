
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Submission } from '../types';
import { Check, X, Eye, FileText, ChevronDown, ChevronUp, MessageSquare, RotateCcw, CheckCircle2, Loader2 } from 'lucide-react';

export const AdminValidation: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
      setLoading(true);
      const all = await db.getSubmissions();
      // Filter out 'scheduled', 'passed', and revision statuses
      setSubmissions(all.filter(s => 
          s.status === 'pending' || 
          s.status === 'rejected' || 
          s.status === 'validated'
      ).sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
      setLoading(false);
  }

  useEffect(() => {
    refreshData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleValidationChange = async (submissionId: string, fileId: string, isValid: boolean) => {
    // Optimistic update for UI smoothness could be added, but waiting is safer
    await db.validateFile(submissionId, fileId, isValid, isValid ? '' : 'Ditolak');
    await refreshData();
  };

  const handleNotesChange = async (submissionId: string, fileId: string, notes: string) => {
     await db.validateFile(submissionId, fileId, false, notes);
     await refreshData();
  };

  const handleReset = async (submissionId: string, fileId: string) => {
      await db.resetFileValidation(submissionId, fileId);
      await refreshData();
  };

  const getRequirements = (sub: Submission) => {
      return db.getRequirements(sub.type);
  };

  if (loading && submissions.length === 0) {
      return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900">Validasi Berkas Masuk</h1>
      
      {submissions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              Tidak ada berkas baru yang perlu divalidasi.
          </div>
      ) : (
          <div className="space-y-4">
              {submissions.map(sub => (
                  <div key={sub.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => toggleExpand(sub.id)}
                      >
                          <div className="flex items-center space-x-4">
                              <div className={`w-2 h-12 rounded-full ${
                                  sub.status === 'validated' ? 'bg-green-500' :
                                  sub.status === 'rejected' ? 'bg-red-500' : 
                                  'bg-yellow-500'
                              }`}></div>
                              <div>
                                  <h3 className="font-bold text-slate-900">{sub.studentName}</h3>
                                  <p className="text-sm text-slate-500">{sub.studentNpm} • <span className="uppercase">{sub.type}</span></p>
                              </div>
                          </div>
                          <div className="flex items-center space-x-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    sub.status === 'validated' ? 'bg-green-100 text-green-700' :
                                    sub.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {sub.status}
                                </span>
                                {expandedId === sub.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                          </div>
                      </div>

                      {expandedId === sub.id && (
                          <div className="p-4 bg-slate-50 border-t border-slate-100">
                              <div className="grid gap-3">
                                  {getRequirements(sub).map(req => {
                                      const file = sub.files[req.id];
                                      const validation = sub.validations[req.id]; 
                                      const isValid = validation?.isValid; 

                                      return (
                                          <div key={req.id} className={`flex flex-col p-3 rounded-lg border transition-colors ${isValid === false ? 'bg-red-50 border-red-200' : isValid === true ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                              <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-3 overflow-hidden">
                                                      <FileText className={`${isValid === true ? 'text-green-600' : isValid === false ? 'text-red-600' : 'text-slate-400'} flex-shrink-0`} size={20} />
                                                      <div className="min-w-0">
                                                          <p className="text-sm font-medium text-slate-900 truncate">{req.label}</p>
                                                          {file ? (
                                                              <a href={file.driveUrl || file.previewUrl} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                                  <Eye size={10} /> Lihat Berkas
                                                              </a>
                                                          ) : (
                                                              <p className="text-xs text-red-500 italic">Berkas belum diupload</p>
                                                          )}
                                                      </div>
                                                  </div>
                                                  
                                                  {file && (
                                                      <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                                          <button 
                                                            onClick={(e) => { e.stopPropagation(); handleValidationChange(sub.id, req.id, true); }}
                                                            className={`p-1.5 rounded-md transition-all ${isValid === true ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-green-600'}`}
                                                            title="Valid"
                                                          >
                                                              <Check size={18} />
                                                          </button>
                                                          <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                                          <button 
                                                            onClick={(e) => { e.stopPropagation(); handleValidationChange(sub.id, req.id, false); }}
                                                            className={`p-1.5 rounded-md transition-all ${isValid === false ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-red-600'}`}
                                                            title="Tolak"
                                                          >
                                                              <X size={18} />
                                                          </button>
                                                          <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                                          <button 
                                                              onClick={(e) => { e.stopPropagation(); handleReset(sub.id, req.id); }}
                                                              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 transition-all"
                                                              title="Reset Status"
                                                          >
                                                              <RotateCcw size={16} />
                                                          </button>
                                                      </div>
                                                  )}
                                              </div>
                                              
                                              {isValid === false && (
                                                  <div className="mt-3 animate-fade-in pl-1">
                                                      <label className="text-xs font-semibold text-red-700 mb-1 block flex items-center gap-1">
                                                          <MessageSquare size={12}/> Alasan Penolakan:
                                                      </label>
                                                      <textarea 
                                                          value={validation.notes || ''}
                                                          onChange={(e) => handleNotesChange(sub.id, req.id, e.target.value)}
                                                          placeholder="Jelaskan kesalahan pada dokumen ini..."
                                                          className="w-full p-2 text-sm border border-red-200 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white placeholder-red-200 text-slate-700"
                                                          rows={2}
                                                          onClick={(e) => e.stopPropagation()}
                                                      />
                                                  </div>
                                              )}
                                          </div>
                                      );
                                  })}
                              </div>
                              <div className="mt-4 flex justify-end">
                                  {sub.status === 'validated' && (
                                      <div className="text-green-600 font-bold flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                                          <CheckCircle2 size={20} /> Siap Dijadwalkan
                                      </div>
                                  )}
                                  {sub.status === 'rejected' && (
                                      <div className="text-red-600 font-bold flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
                                          <X size={20} /> Dikembalikan ke Mahasiswa
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};
