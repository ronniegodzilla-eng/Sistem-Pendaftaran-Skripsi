
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Submission, FileRequirement, ValidationItem } from '../types';
import { BookOpen, CheckSquare, Eye, FileText, CheckCircle2, User, AlertCircle, List, Check, X, Settings, Save, Plus, Trash2, MessageSquare, Send, CheckCircle, Loader2 } from 'lucide-react';

export const LibraryAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'validation' | 'settings'>('validation');
  
  const [pendingRevisions, setPendingRevisions] = useState<Submission[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<Submission | null>(null);
  const [hardcopyChecked, setHardcopyChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const [reqType, setReqType] = useState<'proposal' | 'skripsi'>('proposal');
  const [requirements, setRequirements] = useState<FileRequirement[]>([]);
  const [hasReqChanges, setHasReqChanges] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    const all = await db.getSubmissions();
    const relevant = all.filter(s => 
        s.status === 'revision_proposal_pending' || 
        s.status === 'revision_skripsi_pending' ||
        s.status === 'proposal_completed' || 
        s.status === 'skripsi_completed'
    );

    relevant.sort((a, b) => {
        const isAPending = a.status.includes('pending');
        const isBPending = b.status.includes('pending');
        if (isAPending && !isBPending) return -1;
        if (!isAPending && isBPending) return 1;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    setPendingRevisions(relevant);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (activeTab === 'settings') {
        const reqs = db.getRevisionRequirements(reqType);
        setRequirements(JSON.parse(JSON.stringify(reqs)));
        setHasReqChanges(false);
    }
  }, [activeTab, reqType]);

  const handleSelect = (sub: Submission) => {
      setSelectedRevision(sub);
      const isCompleted = sub.status === 'proposal_completed' || sub.status === 'skripsi_completed';
      setHardcopyChecked(isCompleted);
  };

  const getRequirements = (type: 'proposal' | 'skripsi'): FileRequirement[] => {
      return db.getRevisionRequirements(type);
  };

  const handleValidateFile = async (subId: string, fileId: string, isValid: boolean) => {
      const allSubs = await db.getSubmissions();
      const sub = allSubs.find(s => s.id === subId);
      const existingNotes = sub?.validations[fileId]?.notes || '';
      
      await db.validateFile(subId, fileId, isValid, isValid ? '' : existingNotes);
      
      // Update Local Selection State
      const updatedSubs = await db.getSubmissions();
      const updated = updatedSubs.find(s => s.id === subId);
      if (updated) setSelectedRevision({...updated});
      await refreshData();
  };

  const handleNotesChange = async (subId: string, fileId: string, notes: string) => {
      await db.validateFile(subId, fileId, false, notes);
      const allSubs = await db.getSubmissions();
      const updated = allSubs.find(s => s.id === subId);
      if (updated) setSelectedRevision({...updated});
      // We don't await refreshData here to keep UI snappy while typing, 
      // but in real app we might debouce save. For now, it saves on every keystroke in logic but maybe laggy.
      // Better to save onBlur or explicit button. But for this demo structure:
  };

  const handleFinalize = async () => {
      if (!selectedRevision || !hardcopyChecked) return;
      
      await db.finalizeRevision(selectedRevision.id);
      
      const nextStep = selectedRevision.type === 'proposal' ? 'Eligible Skripsi' : 'Eligible Yudisium';
      alert(`Validasi Berhasil! Mahasiswa dinyatakan ${nextStep}.`);
      
      const updatedSubs = await db.getSubmissions();
      const updated = updatedSubs.find(s => s.id === selectedRevision.id);
      if (updated) setSelectedRevision({...updated});
      
      await refreshData();
  };

  const handleRequestRepair = async () => {
      if (!selectedRevision) return;
      alert("Status penolakan dan catatan revisi telah disimpan.");
      setSelectedRevision(null);
      setHardcopyChecked(false);
      await refreshData();
  };

  const handleReqChange = (index: number, field: keyof FileRequirement, value: any) => {
      const updated = [...requirements];
      updated[index] = { ...updated[index], [field]: value };
      setRequirements(updated);
      setHasReqChanges(true);
  };

  const handleAddReq = () => {
      const newReq: FileRequirement = {
          id: `rev_req_${Date.now()}`,
          label: 'Syarat Revisi Baru',
          required: true,
          description: '',
          acceptedTypes: '.pdf'
      };
      setRequirements([...requirements, newReq]);
      setHasReqChanges(true);
  };

  const handleDeleteReq = (index: number) => {
      if(confirm('Hapus syarat ini?')) {
          const updated = requirements.filter((_, i) => i !== index);
          setRequirements(updated);
          setHasReqChanges(true);
      }
  };

  const saveRequirements = () => {
      db.updateRevisionRequirements(reqType, requirements);
      setHasReqChanges(false);
      alert('Persyaratan Revisi berhasil disimpan!');
  };

  const areAllFilesValidated = () => {
      if (!selectedRevision) return false;
      const reqs = getRequirements(selectedRevision.type);
      return reqs.filter(r => r.required).every(r => selectedRevision.validations[r.id]?.isValid === true);
  };
  
  const hasRejections = () => {
      if (!selectedRevision) return false;
      return Object.values(selectedRevision.validations).some((v: any) => v.isValid === false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">Admin Pustaka</h1>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('validation')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border ${activeTab === 'validation' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-200'}`}><CheckSquare size={16} /> Validasi</button>
                <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border ${activeTab === 'settings' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-200'}`}><Settings size={16} /> Pengaturan Syarat</button>
            </div>
        </div>

        {activeTab === 'validation' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-fit min-h-[500px] flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-50"><h3 className="font-bold text-slate-700 flex items-center gap-2"><List size={18} /> Daftar Revisi</h3></div>
                    <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[600px] relative">
                        {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500"/></div>}
                        {pendingRevisions.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">Tidak ada data.</div>
                        ) : (
                            pendingRevisions.map(sub => {
                                const isCompleted = sub.status === 'proposal_completed' || sub.status === 'skripsi_completed';
                                return (
                                    <div key={sub.id} onClick={() => handleSelect(sub)} className={`p-4 cursor-pointer hover:bg-orange-50 transition-colors ${selectedRevision?.id === sub.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''} ${isCompleted ? 'opacity-75 bg-slate-50' : ''}`}>
                                        <p className="font-medium text-slate-900">{sub.studentName}</p>
                                        <p className="text-xs text-slate-500 mb-1">{sub.studentNpm} • <span className="uppercase">{sub.type}</span></p>
                                        {isCompleted ? <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 font-bold border border-green-200 flex items-center w-fit gap-1"><CheckCircle2 size={10} /> Selesai Revisi</span> : <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-100 text-yellow-700 font-bold border border-yellow-200">Menunggu Validasi</span>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {selectedRevision ? (
                        <div className={`bg-white border border-slate-200 rounded-xl shadow-sm p-6 animate-fade-in border-t-4 ${selectedRevision.status.includes('completed') ? 'border-t-green-500' : 'border-t-orange-500'}`}>
                             {/* ... Content remains similar but wrapped actions calls ... */}
                             {/* Simplified for brevity in XML, logic is handled in handlers above */}
                             <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 mb-1">{selectedRevision.studentName}</h2>
                                    <p className="text-slate-500 text-sm uppercase tracking-wide font-semibold">{selectedRevision.type} - {selectedRevision.studentNpm}</p>
                                </div>
                                {(selectedRevision.status === 'proposal_completed' || selectedRevision.status === 'skripsi_completed') && (
                                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                        <CheckCircle size={20} /><span className="font-bold text-sm">Validasi Selesai</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText size={18} className="text-indigo-600"/> Validasi Berkas Digital</h3>
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        {getRequirements(selectedRevision.type).map(req => {
                                            const file = selectedRevision.files[req.id];
                                            const validation = selectedRevision.validations[req.id] as ValidationItem | undefined;
                                            const isValid = validation?.isValid;
                                            const isCompleted = selectedRevision.status.includes('completed');

                                            return (
                                                <div key={req.id} className={`flex flex-col p-3 rounded-lg border transition-colors ${isValid === false ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                             <div className={`p-2 rounded-lg ${isValid ? 'bg-green-100 text-green-600' : isValid === false ? 'bg-red-100 text-red-500' : file ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                {isValid ? <CheckCircle2 size={16} /> : isValid === false ? <X size={16} /> : file ? <FileText size={16} /> : <AlertCircle size={16} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">{req.label}</p>
                                                                {file ? <a href={file.driveUrl || file.previewUrl} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Eye size={10} /> Lihat File</a> : <span className="text-xs text-red-500">Belum diupload</span>}
                                                            </div>
                                                        </div>
                                                        {file && !isCompleted && (
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => handleValidateFile(selectedRevision.id, req.id, true)} className={`p-1.5 rounded hover:bg-green-100 ${isValid === true ? 'text-green-600 bg-green-50' : 'text-slate-400'}`}><Check size={18} /></button>
                                                                <button onClick={() => handleValidateFile(selectedRevision.id, req.id, false)} className={`p-1.5 rounded hover:bg-red-100 ${isValid === false ? 'text-red-600 bg-red-50' : 'text-slate-400'}`}><X size={18} /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isValid === false && (
                                                        <div className="mt-3 pl-12 pr-2 animate-fade-in">
                                                            <label className="text-xs font-semibold text-red-700 mb-1 block">Alasan Penolakan:</label>
                                                            <div className="relative">
                                                                <MessageSquare size={14} className="absolute left-3 top-3 text-red-400" />
                                                                <textarea value={validation?.notes || ''} onChange={(e) => handleNotesChange(selectedRevision.id, req.id, e.target.value)} className="w-full pl-9 p-2 text-sm border border-red-200 rounded-md bg-white" rows={2} disabled={isCompleted}/>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><BookOpen size={18} className="text-orange-600"/> Validasi Fisik</h3>
                                    <div className={`${selectedRevision.status.includes('completed') ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-4`}>
                                        <label className={`flex items-start gap-3 ${!selectedRevision.status.includes('completed') ? 'cursor-pointer' : ''}`}>
                                            <input type="checkbox" checked={hardcopyChecked} onChange={(e) => setHardcopyChecked(e.target.checked)} disabled={selectedRevision.status.includes('completed')} className={`mt-1 w-5 h-5 rounded focus:ring-offset-0 ${selectedRevision.status.includes('completed') ? 'text-green-600 border-green-300' : 'text-orange-600 border-gray-300 focus:ring-orange-500'}`}/>
                                            <div>
                                                <span className="font-bold text-slate-800 block">Hardcopy Telah Diterima</span>
                                                <span className="text-sm text-slate-600">{selectedRevision.status.includes('completed') ? 'Dokumen fisik sudah diverifikasi.' : 'Saya menyatakan telah menerima dokumen fisik lengkap.'}</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {!selectedRevision.status.includes('completed') && (
                                    <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 items-center">
                                        {hasRejections() ? (
                                            <button onClick={handleRequestRepair} className="px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 transition-all"><Send size={20} /> Minta Perbaikan</button>
                                        ) : (
                                            <button onClick={handleFinalize} disabled={!hardcopyChecked || !areAllFilesValidated()} className={`px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all ${hardcopyChecked && areAllFilesValidated() ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}><CheckSquare size={20} /> Validasi & Selesaikan</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-xl min-h-[300px]"><User size={48} className="mb-2 opacity-50" /><p>Pilih mahasiswa dari daftar.</p></div>
                    )}
                </div>
            </div>
        ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Kustomisasi Syarat Revisi</h2>
                    <button onClick={saveRequirements} disabled={!hasReqChanges} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"><Save size={18} /> Simpan Perubahan</button>
                </div>
                <div className="flex space-x-2 mb-6">
                    <button onClick={() => setReqType('proposal')} className={`px-4 py-2 rounded-lg text-sm font-medium ${reqType === 'proposal' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Proposal</button>
                    <button onClick={() => setReqType('skripsi')} className={`px-4 py-2 rounded-lg text-sm font-medium ${reqType === 'skripsi' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Skripsi</button>
                </div>
                <div className="space-y-4">
                  {requirements.map((req, idx) => (
                      <div key={req.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col md:flex-row gap-4 items-start">
                          <div className="flex-1 space-y-3 w-full">
                              <div className="flex gap-4">
                                  <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">Label Syarat</label><input type="text" value={req.label} onChange={(e) => handleReqChange(idx, 'label', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 mt-1"/></div>
                                  <div className="w-32"><label className="text-xs font-bold text-slate-500 uppercase">Tipe File</label><input type="text" value={req.acceptedTypes || ''} onChange={(e) => handleReqChange(idx, 'acceptedTypes', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 mt-1"/></div>
                              </div>
                              <div><label className="text-xs font-bold text-slate-500 uppercase">Deskripsi / Keterangan</label><input type="text" value={req.description || ''} onChange={(e) => handleReqChange(idx, 'description', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 mt-1"/></div>
                          </div>
                          <div className="flex flex-col gap-2 items-center pt-5">
                              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={req.required} onChange={(e) => handleReqChange(idx, 'required', e.target.checked)} className="w-4 h-4 text-indigo-600"/><span className="text-sm font-medium">Wajib</span></label>
                              <button onClick={() => handleDeleteReq(idx)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                          </div>
                      </div>
                  ))}
                  <button onClick={handleAddReq} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-500 hover:text-indigo-600 flex justify-center items-center gap-2 font-medium transition-colors"><Plus size={20} /> Tambah Syarat Revisi Baru</button>
              </div>
            </div>
        )}
    </div>
  );
};
