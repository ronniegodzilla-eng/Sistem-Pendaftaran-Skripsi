
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDb';
import { getAllStudents, updateStudent, deleteStudents, restoreStudents, importStudents, parseExcel, downloadExcelTemplate } from '../services/studentService';
import { getDriveConfig, saveDriveConfig, isDriveConfigured } from '../services/driveService';
import { FileRequirement, Student, Submission, Schedule } from '../types';
import { Save, Plus, Trash2, Edit2, Upload, Search, Database, FileText, Check, Download, Cloud, ExternalLink, AlertTriangle, Copy, Code, HelpCircle, Info, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, X, RotateCcw } from 'lucide-react';

interface AdminSettingsProps {
    onDataChange?: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onDataChange }) => {
  const [activeTab, setActiveTab] = useState<'requirements' | 'database' | 'integration'>('requirements');
  
  // --- Requirements State ---
  const [reqType, setReqType] = useState<'proposal' | 'skripsi'>('proposal');
  const [requirements, setRequirements] = useState<FileRequirement[]>([]);
  const [hasReqChanges, setHasReqChanges] = useState(false);

  // --- Database State ---
  const [students, setStudents] = useState<Student[]>([]);
  const [dbSearch, setDbSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStats, setImportStats] = useState<{added: number, updated: number} | null>(null);
  
  // Database Table Enhanced Features
  const [selectedNpms, setSelectedNpms] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student; direction: 'asc' | 'desc' } | null>(null);

  // --- Integration State ---
  const [scriptUrl, setScriptUrl] = useState('');
  const [isDriveConnected, setIsDriveConnected] = useState(false);

  // --- Actions & Undo State ---
  const [isResetting, setIsResetting] = useState(false);
  
  // Confirmation Modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUndoResetConfirm, setShowUndoResetConfirm] = useState(false);
  const [showUndoDeleteConfirm, setShowUndoDeleteConfirm] = useState(false);

  // Undo Data Holders
  const [undoData_Reset, setUndoData_Reset] = useState<{submissions: Submission[], schedules: Schedule[]} | null>(null);
  const [undoData_Delete, setUndoData_Delete] = useState<Student[] | null>(null);

  useEffect(() => {
    // Load Requirements
    const reqs = db.getRequirements(reqType);
    setRequirements(JSON.parse(JSON.stringify(reqs))); // Deep copy
    setHasReqChanges(false);
  }, [reqType]);

  useEffect(() => {
    // Load Students
    if (activeTab === 'database') {
        loadStudents();
    }
    // Load Drive Config
    if (activeTab === 'integration') {
        const config = getDriveConfig();
        setScriptUrl(config.scriptUrl || '');
        setIsDriveConnected(isDriveConfigured());
    }
  }, [activeTab]);

  const loadStudents = async () => {
      const data = await getAllStudents();
      setStudents(data);
      // Don't reset selectedNpms here to avoid losing selection on auto-refresh/sort
  };

  // === REQUIREMENTS LOGIC ===
  const handleReqChange = (index: number, field: keyof FileRequirement, value: any) => {
      const updated = [...requirements];
      updated[index] = { ...updated[index], [field]: value };
      setRequirements(updated);
      setHasReqChanges(true);
  };

  const handleAddReq = () => {
      const newReq: FileRequirement = {
          id: `new_req_${Date.now()}`,
          label: 'Syarat Baru',
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
      db.updateRequirements(reqType, requirements);
      setHasReqChanges(false);
      alert('Persyaratan berhasil disimpan!');
  };

  // === DATABASE LOGIC ===
  const handleSort = (key: keyof Student) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const getProcessedStudents = () => {
      let processed = students.filter(s => 
          s.nama.toLowerCase().includes(dbSearch.toLowerCase()) || 
          s.npm.includes(dbSearch)
      );

      if (sortConfig) {
          processed.sort((a, b) => {
              const aVal = a[sortConfig.key]?.toString().toLowerCase() || '';
              const bVal = b[sortConfig.key]?.toString().toLowerCase() || '';
              if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return processed;
  };

  const processedStudents = getProcessedStudents();

  const toggleSelectAll = () => {
      if (selectedNpms.size === processedStudents.length && processedStudents.length > 0) {
          setSelectedNpms(new Set());
      } else {
          const allNpms = processedStudents.map(s => s.npm);
          setSelectedNpms(new Set(allNpms));
      }
  };

  const toggleSelectRow = (npm: string) => {
      const newSet = new Set(selectedNpms);
      if (newSet.has(npm)) newSet.delete(npm);
      else newSet.add(npm);
      setSelectedNpms(newSet);
  };

  // --- BULK DELETE LOGIC ---
  const handleBulkDeleteClick = () => {
      if (selectedNpms.size === 0) return;
      setShowDeleteConfirm(true);
  };

  const executeBulkDelete = async () => {
      setShowDeleteConfirm(false);
      
      // 1. Snapshot for Undo
      const studentsToDelete = students.filter(s => selectedNpms.has(s.npm));
      setUndoData_Delete(studentsToDelete);

      // 2. Execute Delete
      await deleteStudents(Array.from(selectedNpms));
      
      // 3. Update UI
      setSelectedNpms(new Set());
      await loadStudents();
      
      alert(`${studentsToDelete.length} data mahasiswa berhasil dihapus.`);
  };

  // --- RESTORE / UNDO DELETE LOGIC ---
  const handleUndoDeleteClick = () => {
      setShowUndoDeleteConfirm(true);
  };

  const executeUndoDelete = async () => {
      setShowUndoDeleteConfirm(false);
      if (!undoData_Delete) return;

      await restoreStudents(undoData_Delete);
      setUndoData_Delete(null); // Clear undo stack
      await loadStudents();
      alert("Data mahasiswa berhasil dikembalikan.");
  };

  const startEditStudent = (student: Student) => {
      setEditingStudent({ ...student });
  };

  const saveEditStudent = async () => {
      if (editingStudent) {
          await updateStudent(editingStudent.npm, editingStudent);
          setEditingStudent(null);
          loadStudents();
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const buffer = event.target?.result as ArrayBuffer;
          try {
              const parsed = parseExcel(buffer);
              const stats = await importStudents(parsed);
              setImportStats(stats);
              loadStudents();
              setTimeout(() => setImportStats(null), 5000);
          } catch (err) {
              console.error(err);
              alert('Gagal parsing Excel. Pastikan format benar.');
          }
      };
      reader.readAsArrayBuffer(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
      downloadExcelTemplate();
  };

  // === RESET PROCESS LOGIC ===
  const handleResetClick = () => {
      setShowResetConfirm(true);
  };

  const executeReset = async () => {
      setShowResetConfirm(false);
      setIsResetting(true);
      
      // 1. Snapshot for Undo
      const snapshot = db.getProcessSnapshot();
      setUndoData_Reset(snapshot);

      // 2. Execute Reset
      await db.resetProcessData();
      
      if(onDataChange) onDataChange();
      
      setIsResetting(false);
      alert("Data proses berhasil direset. Sistem siap untuk demo baru.");
  };

  // --- RESTORE / UNDO RESET LOGIC ---
  const handleUndoResetClick = () => {
      setShowUndoResetConfirm(true);
  };

  const executeUndoReset = async () => {
      setShowUndoResetConfirm(false);
      if (!undoData_Reset) return;

      setIsResetting(true);
      await db.restoreProcessSnapshot(undoData_Reset);
      if(onDataChange) onDataChange();
      
      setUndoData_Reset(null); // Clear undo stack
      setIsResetting(false);
      alert("Data proses berhasil dikembalikan ke status sebelum reset.");
  };

  // === INTEGRATION LOGIC ===
  const handleSaveIntegration = () => {
      saveDriveConfig({ scriptUrl: scriptUrl.trim() });
      setIsDriveConnected(!!scriptUrl.trim());
      alert('Konfigurasi Google Drive berhasil disimpan.');
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert('Kode berhasil disalin!');
  };

  const APPS_SCRIPT_CODE = `
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var filename = data.filename;
    var mimeType = data.mimeType;
    var base64 = data.file;
    
    // NAMA FOLDER DI DRIVE ANDA
    var folderName = "Arsip_Sistem_Skripsi";
    
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, filename);
    var file = folder.createFile(blob);
    
    // Agar bisa dilihat di aplikasi tanpa login
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      id: file.getId(),
      url: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
  `.trim();

  const SortIcon = ({ column }: { column: keyof Student }) => {
      if (sortConfig?.key !== column) return <ArrowUpDown size={14} className="text-slate-300 ml-1 inline" />;
      return sortConfig.direction === 'asc' 
        ? <ArrowUp size={14} className="text-indigo-600 ml-1 inline" /> 
        : <ArrowDown size={14} className="text-indigo-600 ml-1 inline" />;
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
        <div className="flex justify-between items-start">
             <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
             <div className="flex items-center gap-2">
                 {undoData_Reset && (
                     <button
                        onClick={handleUndoResetClick}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
                     >
                         <RotateCcw size={16} /> Undo Reset
                     </button>
                 )}
                 <button 
                    onClick={handleResetClick}
                    disabled={isResetting}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <RefreshCw size={16} className={isResetting ? "animate-spin" : ""} />
                    {isResetting ? "Mereset..." : "Reset Data Proses (Demo Mode)"}
                </button>
             </div>
        </div>
      

      {/* TABS */}
      <div className="flex flex-col md:flex-row border-b border-slate-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
        <button 
            onClick={() => setActiveTab('requirements')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'requirements' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
            <FileText size={18} /> Kustomisasi Syarat
        </button>
        <button 
            onClick={() => setActiveTab('database')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'database' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
            <Database size={18} /> Database Mahasiswa
        </button>
        <button 
            onClick={() => setActiveTab('integration')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'integration' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
            <Cloud size={18} /> Drive Admin (Gratis)
        </button>
      </div>

      {/* CONTENT: REQUIREMENTS */}
      {activeTab === 'requirements' && (
          <div className="bg-white p-6 rounded-b-xl shadow-sm border border-t-0 border-slate-200 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-2">
                      <button onClick={() => setReqType('proposal')} className={`px-4 py-2 rounded-lg text-sm font-medium ${reqType === 'proposal' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Proposal</button>
                      <button onClick={() => setReqType('skripsi')} className={`px-4 py-2 rounded-lg text-sm font-medium ${reqType === 'skripsi' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Skripsi</button>
                  </div>
                  <button onClick={saveRequirements} disabled={!hasReqChanges} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Save size={18} /> Simpan Perubahan
                  </button>
              </div>

              <div className="space-y-4">
                  {requirements.map((req, idx) => (
                      <div key={req.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col md:flex-row gap-4 items-start">
                          <div className="flex-1 space-y-3 w-full">
                              <div className="flex gap-4">
                                  <div className="flex-1">
                                      <label className="text-xs font-bold text-slate-500 uppercase">Label Syarat</label>
                                      <input 
                                        type="text" 
                                        value={req.label} 
                                        onChange={(e) => handleReqChange(idx, 'label', e.target.value)}
                                        className="w-full border border-slate-300 rounded px-2 py-1 mt-1"
                                      />
                                  </div>
                                  <div className="w-32">
                                      <label className="text-xs font-bold text-slate-500 uppercase">Tipe File</label>
                                      <input 
                                        type="text" 
                                        value={req.acceptedTypes || ''} 
                                        onChange={(e) => handleReqChange(idx, 'acceptedTypes', e.target.value)}
                                        className="w-full border border-slate-300 rounded px-2 py-1 mt-1"
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase">Deskripsi / Keterangan</label>
                                  <input 
                                    type="text" 
                                    value={req.description || ''} 
                                    onChange={(e) => handleReqChange(idx, 'description', e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2 py-1 mt-1"
                                  />
                              </div>
                          </div>
                          <div className="flex flex-col gap-2 items-center pt-5">
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={req.required} 
                                    onChange={(e) => handleReqChange(idx, 'required', e.target.checked)}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                  <span className="text-sm font-medium">Wajib</span>
                              </label>
                              <button onClick={() => handleDeleteReq(idx)} className="text-red-500 hover:text-red-700 p-2">
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      </div>
                  ))}
                  
                  <button onClick={handleAddReq} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-500 hover:text-indigo-600 flex justify-center items-center gap-2 font-medium transition-colors">
                      <Plus size={20} /> Tambah Syarat Baru
                  </button>
              </div>
          </div>
      )}

      {/* CONTENT: DATABASE */}
      {activeTab === 'database' && (
          <div className="bg-white p-6 rounded-b-xl shadow-sm border border-t-0 border-slate-200 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><Database size={20} className="text-indigo-600"/> Data Induk Mahasiswa (Master Data)</h3>
                    <p className="text-xs text-slate-500">Data ini bersifat global. Total Data: {students.length}</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        onClick={handleDownloadTemplate} 
                        className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 border border-slate-200"
                        title="Download Template Excel"
                      >
                          <Download size={18} /> <span className="hidden md:inline">Template</span>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                      >
                          <Upload size={18} /> Import Excel
                      </button>
                  </div>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cari Nama / NPM di Data Induk..." 
                        value={dbSearch}
                        onChange={(e) => setDbSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                      {undoData_Delete && (
                          <button
                            onClick={handleUndoDeleteClick}
                            className="bg-yellow-500 text-white hover:bg-yellow-600 px-4 py-2 rounded-lg flex items-center gap-2 font-medium whitespace-nowrap"
                          >
                              <RotateCcw size={16} /> Undo Hapus
                          </button>
                      )}
                      {selectedNpms.size > 0 && (
                          <button 
                            onClick={handleBulkDeleteClick}
                            className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg flex items-center gap-2 font-medium whitespace-nowrap"
                          >
                              <Trash2 size={16} /> Hapus ({selectedNpms.size})
                          </button>
                      )}
                  </div>
              </div>

              {importStats && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 animate-fade-in">
                      <Check size={18} /> 
                      Import Berhasil: {importStats.added} Data Baru, {importStats.updated} Data Diupdate (Data kosong terisi).
                  </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col max-h-[600px]">
                  <div className="overflow-y-auto overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-left w-12 bg-slate-50">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-slate-300"
                                        checked={selectedNpms.size === processedStudents.length && processedStudents.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th onClick={() => handleSort('nama')} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100">
                                    Nama & NPM <SortIcon column="nama"/>
                                </th>
                                <th onClick={() => handleSort('prodi')} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100">
                                    Prodi <SortIcon column="prodi"/>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Judul Skripsi</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Pembimbing</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Penguji</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {processedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">Tidak ada data ditemukan.</td>
                                </tr>
                            ) : (
                                processedStudents.map(student => (
                                <tr key={student.npm} className={`hover:bg-slate-50 ${selectedNpms.has(student.npm) ? 'bg-indigo-50/50' : ''}`}>
                                    <td className="px-4 py-3">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300"
                                            checked={selectedNpms.has(student.npm)}
                                            onChange={() => toggleSelectRow(student.npm)}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-slate-900">{student.nama}</p>
                                        <p className="text-xs text-slate-500">{student.npm}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{student.prodi}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-xs">{student.judul_skripsi}</td>
                                    <td className="px-4 py-3 text-xs text-slate-600">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-slate-700">P1: {student.pembimbing_1 || '-'}</span>
                                            <span>P2: {student.pembimbing_2 || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-slate-700">U1: {student.penguji_1 || '-'}</span>
                                            <span>U2: {student.penguji_2 || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => startEditStudent(student)}
                                            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                  </div>
              </div>

              {/* EDIT MODAL */}
              {editingStudent && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl animate-fade-in-up">
                          <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Data Mahasiswa</h3>
                          <div className="space-y-3">
                              <div>
                                  <label className="text-xs font-bold text-slate-500">Nama</label>
                                  <input className="w-full border p-2 rounded" value={editingStudent.nama} onChange={e => setEditingStudent({...editingStudent, nama: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-xs font-bold text-slate-500">NPM (ID)</label>
                                      <input className="w-full border p-2 rounded bg-slate-100" value={editingStudent.npm} disabled />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-slate-500">Prodi</label>
                                      <input className="w-full border p-2 rounded" value={editingStudent.prodi} onChange={e => setEditingStudent({...editingStudent, prodi: e.target.value})} />
                                  </div>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500">Judul Skripsi</label>
                                  <textarea className="w-full border p-2 rounded" rows={2} value={editingStudent.judul_skripsi} onChange={e => setEditingStudent({...editingStudent, judul_skripsi: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                  <input className="w-full border p-2 rounded text-xs" placeholder="Pembimbing 1" value={editingStudent.pembimbing_1} onChange={e => setEditingStudent({...editingStudent, pembimbing_1: e.target.value})} />
                                  <input className="w-full border p-2 rounded text-xs" placeholder="Pembimbing 2" value={editingStudent.pembimbing_2} onChange={e => setEditingStudent({...editingStudent, pembimbing_2: e.target.value})} />
                                  <input className="w-full border p-2 rounded text-xs" placeholder="Penguji 1" value={editingStudent.penguji_1} onChange={e => setEditingStudent({...editingStudent, penguji_1: e.target.value})} />
                                  <input className="w-full border p-2 rounded text-xs" placeholder="Penguji 2" value={editingStudent.penguji_2} onChange={e => setEditingStudent({...editingStudent, penguji_2: e.target.value})} />
                              </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-6">
                              <button onClick={() => setEditingStudent(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                              <button onClick={saveEditStudent} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Simpan</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* CONTENT: INTEGRATION (APPS SCRIPT) */}
      {activeTab === 'integration' && (
          <div className="bg-white p-6 rounded-b-xl shadow-sm border border-t-0 border-slate-200 animate-fade-in">
              <div className="max-w-4xl">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Cloud className="text-indigo-600"/> Konfigurasi Drive Admin (Via Apps Script)
                  </h2>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
                      <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2"><Info size={18}/> Metode Google Apps Script (Gratis)</h4>
                      <p className="text-sm text-blue-700 mb-2">
                          Agar file tersimpan di <strong>Drive Admin (Anda)</strong> dan bukan mahasiswa, kita menggunakan "Google Apps Script" sebagai jembatan.
                      </p>
                  </div>

                  {/* Status Indicator */}
                  <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 border ${isDriveConnected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      {isDriveConnected ? (
                          <Check className="text-green-600" size={24} />
                      ) : (
                          <AlertTriangle className="text-yellow-600" size={24} />
                      )}
                      <div>
                          <p className={`font-bold ${isDriveConnected ? 'text-green-700' : 'text-yellow-700'}`}>
                              {isDriveConnected ? 'Siap Menerima File' : 'Belum Terkonfigurasi'}
                          </p>
                          <p className="text-xs text-slate-600">
                              {isDriveConnected 
                                  ? 'Web App URL terdeteksi. Upload akan masuk ke Drive Admin.' 
                                  : 'Masukkan Web App URL untuk mengaktifkan upload ke Drive Anda.'}
                          </p>
                      </div>
                  </div>

                  {/* Step by Step Guide */}
                  <div className="space-y-6">
                      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                          <h4 className="font-bold text-slate-800 mb-2">Langkah 1: Buat Script</h4>
                          <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                              <li>Buka <a href="https://script.google.com/home" target="_blank" className="text-indigo-600 underline">script.google.com</a> dan klik "+ New Project".</li>
                              <li>Hapus semua kode yang ada di editor.</li>
                              <li>Salin dan tempel kode di bawah ini:</li>
                          </ol>
                          
                          <div className="relative mt-3">
                              <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs overflow-x-auto font-mono border border-slate-700">
                                  {APPS_SCRIPT_CODE}
                              </pre>
                              <button 
                                  onClick={() => copyToClipboard(APPS_SCRIPT_CODE)}
                                  className="absolute top-2 right-2 bg-slate-700 text-white p-2 rounded hover:bg-slate-600"
                                  title="Salin Kode"
                              >
                                  <Copy size={14} />
                              </button>
                          </div>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                          <h4 className="font-bold text-slate-800 mb-2">Langkah 2: Deploy sebagai Web App</h4>
                          <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                              <li>Klik tombol biru <strong>Deploy</strong> {'>'} <strong>New deployment</strong>.</li>
                              <li>Pilih type: <strong>Web app</strong> (icon roda gigi).</li>
                              <li>Isi Description bebas (misal: "Upload API").</li>
                              <li><strong>Execute as: Me (email anda)</strong> (PENTING!).</li>
                              <li><strong>Who has access: Anyone</strong> (PENTING! Agar mahasiswa bisa upload tanpa login akun anda).</li>
                              <li>Klik <strong>Deploy</strong> dan beri izin akses (Review Permissions).</li>
                              <li>Salin <strong>Web app URL</strong> yang muncul (diakhiri `/exec`).</li>
                          </ol>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                          <h4 className="font-bold text-slate-800 mb-2">Langkah 3: Simpan URL</h4>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Web App URL</label>
                          <div className="flex gap-2">
                              <input 
                                  type="text" 
                                  value={scriptUrl}
                                  onChange={(e) => setScriptUrl(e.target.value)}
                                  placeholder="https://script.google.com/macros/s/..../exec"
                                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                              />
                              <button 
                                  onClick={handleSaveIntegration}
                                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                              >
                                  Simpan
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRM RESET MODAL */}
      {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up border border-red-100">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                          <AlertTriangle size={24} /> Konfirmasi Reset
                      </h3>
                      <button onClick={() => setShowResetConfirm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
                      <p className="text-sm text-red-800 font-medium mb-2">PERINGATAN KERAS:</p>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                          <li>Semua data <strong>Pendaftaran & Jadwal</strong> akan dihapus.</li>
                          <li>Semua <strong>File Upload</strong> di sistem akan direset.</li>
                          <li>Data Induk Mahasiswa <strong>TIDAK</strong> akan dihapus.</li>
                      </ul>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50">Batal</button>
                      <button onClick={executeReset} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Ya, Reset Data</button>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up border border-red-100">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                          <Trash2 size={24} /> Konfirmasi Hapus Database
                      </h3>
                      <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <p className="text-slate-700 mb-4">
                      Anda akan menghapus <strong>{selectedNpms.size}</strong> data mahasiswa dari Database Induk.
                  </p>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
                      <p className="text-sm text-red-800 italic">
                          Tindakan ini akan menghapus data permanen kecuali Anda menekan "Undo" segera setelah ini.
                      </p>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50">Batal</button>
                      <button onClick={executeBulkDelete} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Hapus Data</button>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRM UNDO RESET MODAL */}
      {showUndoResetConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up border border-yellow-100">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
                          <RotateCcw size={24} /> Konfirmasi Undo Reset
                      </h3>
                      <button onClick={() => setShowUndoResetConfirm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <p className="text-slate-700 mb-6">
                      Apakah Anda yakin ingin mengembalikan data proses pendaftaran dan jadwal ke kondisi sebelum reset terakhir?
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowUndoResetConfirm(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50">Batal</button>
                      <button onClick={executeUndoReset} className="flex-1 py-2.5 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600">Ya, Kembalikan</button>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRM UNDO DELETE MODAL */}
      {showUndoDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up border border-yellow-100">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
                          <RotateCcw size={24} /> Konfirmasi Undo Hapus
                      </h3>
                      <button onClick={() => setShowUndoDeleteConfirm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <p className="text-slate-700 mb-6">
                      Apakah Anda yakin ingin mengembalikan <strong>{undoData_Delete?.length}</strong> data mahasiswa yang baru saja dihapus?
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowUndoDeleteConfirm(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50">Batal</button>
                      <button onClick={executeUndoDelete} className="flex-1 py-2.5 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600">Ya, Kembalikan</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
