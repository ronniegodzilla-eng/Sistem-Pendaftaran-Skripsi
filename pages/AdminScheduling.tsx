
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Submission, Schedule, Student } from '../types';
import { getStudentByNPM } from '../services/studentService';
import { Calendar, AlertTriangle, User, Settings, Plus, X, CheckSquare, List, Loader2 } from 'lucide-react';

export const AdminScheduling: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'scheduled'>('queue');
  const [readySubmissions, setReadySubmissions] = useState<Submission[]>([]);
  const [existingSchedules, setExistingSchedules] = useState<Schedule[]>([]);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [studentDetails, setStudentDetails] = useState<Student | null>(null);
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');
  const [conflictError, setConflictError] = useState<string | null>(null);

  const [showRoomManage, setShowRoomManage] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    const allSubs = await db.getSubmissions();
    const schedules = await db.getSchedules();
    setReadySubmissions(allSubs.filter(s => s.status === 'validated'));
    setExistingSchedules(schedules);
    setAvailableRooms(db.getRooms());
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
      let npm = '';
      if (selectedSubmission) npm = selectedSubmission.studentNpm;
      else if (selectedSchedule) {
           const subId = selectedSchedule.submissionId;
           // We need to fetch this async if it wasn't preloaded, but for now we assume refreshData populates cache if using mockDb class
           // For simplicity in this component, we might rely on the fact that mockDb.getSubmissions() was called. 
           // BUT proper way is to call db.getSubmissionByNpm or find in readySubmissions if possible.
           // Since getSubmissions is async, we can't synchronously find. 
           // Let's refetch specific student.
           getStudentByNPM(selectedSchedule.studentName).then(() => {}); // Logic update needed here slightly
      }

      // Simplified logic: Just fetch student details if we have an NPM
      if (npm) {
          getStudentByNPM(npm).then(data => setStudentDetails(data));
      } else if (selectedSchedule) {
          // If we only have schedule, we might need to look up submission to get NPM
          db.getSubmissions().then(subs => {
               const sub = subs.find(s => s.id === selectedSchedule.submissionId);
               if(sub) getStudentByNPM(sub.studentNpm).then(setStudentDetails);
          });
      } else {
          setStudentDetails(null);
      }
  }, [selectedSubmission, selectedSchedule]);

  const handleStartTimeChange = (val: string) => {
      setTime(val);
      if (val) {
          const [h, m] = val.split(':').map(Number);
          const endH = (h + 2) % 24; 
          const endHStr = endH.toString().padStart(2, '0');
          const mStr = m.toString().padStart(2, '0');
          setEndTime(`${endHStr}:${mStr}`);
      }
  };

  const handleAddRoom = () => {
      if (newRoomName.trim()) {
          db.addRoom(newRoomName.trim());
          setNewRoomName('');
          setAvailableRooms(db.getRooms());
      }
  };

  const handleDeleteRoom = (r: string) => {
      if (confirm(`Hapus ruangan ${r}?`)) {
          db.deleteRoom(r);
          setAvailableRooms(db.getRooms());
          if (room === r) setRoom('');
      }
  };

  const handleSchedule = async () => {
      if (!selectedSubmission || !studentDetails || !date || !time || !endTime || !room) return;
      setProcessing(true);

      const newSchedule: Schedule = {
          id: Date.now().toString(),
          submissionId: selectedSubmission.id,
          type: selectedSubmission.type,
          date,
          time,
          endTime,
          room,
          studentName: studentDetails.nama,
          title: studentDetails.judul_skripsi,
          pembimbing1: studentDetails.pembimbing_1,
          pembimbing2: studentDetails.pembimbing_2,
          penguji1: studentDetails.penguji_1,
          penguji2: studentDetails.penguji_2,
          status: 'upcoming',
          academicYear: db.getActiveYear()
      };

      const error = await db.checkConflict(newSchedule);
      if (error) {
          setConflictError(error);
          setProcessing(false);
          return;
      }

      await db.addSchedule(newSchedule);
      alert('Jadwal berhasil dibuat!');
      
      setSelectedSubmission(null);
      await refreshData();
      setDate('');
      setTime('');
      setEndTime('');
      setRoom('');
      setConflictError(null);
      setProcessing(false);
  };

  const handleResetSchedule = async () => {
      if (!selectedSchedule) return;
      const reason = window.prompt("Masukkan alasan reset jadwal:", "Tidak Lulus / Ujian Ulang");
      if (!reason) return;
      
      setProcessing(true);
      await db.deleteSchedule(selectedSchedule.id, reason);
      alert('Jadwal berhasil direset.');
      
      setSelectedSchedule(null);
      setStudentDetails(null);
      await refreshData();
      setProcessing(false);
  };

  const handlePassExam = async () => {
      if (!selectedSchedule) return;
      setProcessing(true);
      
      await db.completeSchedule(selectedSchedule.id);
      alert(`Sidang Selesai. Status mahasiswa diupdate.`);
      
      setSelectedSchedule(null);
      setStudentDetails(null);
      await refreshData();
      setProcessing(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900">Manajemen Jadwal & Sidang</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-fit flex flex-col min-h-[500px]">
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => { setActiveTab('queue'); setSelectedSchedule(null); }}
                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1 ${activeTab === 'queue' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500'}`}
                >
                    <CheckSquare size={14} /> Antrian
                </button>
                <button 
                    onClick={() => { setActiveTab('scheduled'); setSelectedSubmission(null); }}
                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1 ${activeTab === 'scheduled' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500'}`}
                >
                    <List size={14} /> Terjadwal
                </button>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px] flex-1 relative">
                {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>}
                
                {activeTab === 'queue' && (
                    readySubmissions.length === 0 ? <div className="p-8 text-center text-slate-500 text-sm">Tidak ada antrian.</div> :
                    readySubmissions.map(sub => (
                        <div key={sub.id} onClick={() => { setSelectedSubmission(sub); setConflictError(null); }}
                            className={`p-4 cursor-pointer hover:bg-indigo-50 transition-colors ${selectedSubmission?.id === sub.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}>
                            <p className="font-medium text-slate-900">{sub.studentName}</p>
                            <p className="text-xs text-slate-500">{sub.studentNpm} • <span className="uppercase">{sub.type}</span></p>
                        </div>
                    ))
                )}
                
                {activeTab === 'scheduled' && (
                    existingSchedules.length === 0 ? <div className="p-8 text-center text-slate-500 text-sm">Belum ada jadwal.</div> :
                    existingSchedules.map(sch => (
                        <div key={sch.id} onClick={() => { setSelectedSchedule(sch); }}
                            className={`p-4 cursor-pointer transition-colors border-l-4 
                            ${sch.status === 'completed' 
                                ? 'bg-slate-50 border-slate-300 opacity-70 hover:bg-slate-100' 
                                : (selectedSchedule?.id === sch.id ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-indigo-50 border-transparent')
                            }`}>
                            <div className="flex justify-between items-start">
                                <p className="font-medium text-slate-900">{sch.studentName}</p>
                                {sch.status === 'completed' && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Selesai</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${sch.status === 'completed' ? 'bg-slate-200 text-slate-600' : (sch.type === 'proposal' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')}`}>
                                {sch.type === 'proposal' ? 'Sempro' : 'Sidang'}
                                </span>
                                <span>{sch.date} • {sch.time}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        <div className="lg:col-span-2">
            {activeTab === 'queue' && selectedSubmission && studentDetails && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 animate-fade-in relative">
                    {processing && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>}
                    
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Calendar className="text-indigo-600" /> Form Jadwal Baru
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-1 font-medium">Tanggal</label>
                                <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-sm mb-1 font-medium">Jam Mulai</label>
                                    <input type="time" value={time} onChange={e => handleStartTimeChange(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"/>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm mb-1 font-medium">Jam Selesai</label>
                                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"/>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium">Ruangan</label>
                                <button onClick={() => setShowRoomManage(!showRoomManage)} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                    <Settings size={12} /> Kelola Ruangan
                                </button>
                            </div>
                            
                            {showRoomManage && (
                                <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg animate-fade-in">
                                    <div className="flex gap-2 mb-2">
                                        <input type="text" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="Nama Ruangan..." className="flex-1 border p-1.5 rounded text-sm"/>
                                        <button onClick={handleAddRoom} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm"><Plus size={16} /></button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {availableRooms.map(r => (
                                            <span key={r} className="bg-white border border-slate-300 px-2 py-1 rounded text-xs flex items-center gap-1">
                                                {r} <button onClick={() => handleDeleteRoom(r)} className="text-red-500 hover:text-red-700 ml-1"><X size={12}/></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <select value={room} onChange={e=>setRoom(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500">
                                <option value="">-- Pilih Ruangan --</option>
                                {availableRooms.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    {conflictError && (
                        <div className="mt-4 text-red-700 bg-red-50 border border-red-200 p-3 rounded flex items-start gap-2 animate-pulse">
                            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                            <span className="text-sm font-medium">{conflictError}</span>
                        </div>
                    )}
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                        <button type="button" onClick={handleSchedule} disabled={!date||!time||!endTime||!room || processing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50">
                            {processing ? <Loader2 className="animate-spin"/> : 'Simpan Jadwal'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'scheduled' && selectedSchedule && studentDetails && (
                <div className={`bg-white border border-slate-200 rounded-xl shadow-sm p-6 animate-fade-in border-l-4 ${selectedSchedule.status === 'completed' ? 'border-l-slate-400' : 'border-l-green-500'} relative`}>
                     {processing && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>}
                     <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Detail Jadwal {selectedSchedule.status === 'completed' ? '(Selesai)' : '(Aktif)'}</h2>
                            <p className="text-lg font-medium">{selectedSchedule.studentName}</p>
                        </div>
                        {selectedSchedule.status === 'completed' && <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Selesai</span>}
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                         <div>
                             <span className="block text-slate-500">Waktu</span>
                             <span className="font-medium">{selectedSchedule.date}, {selectedSchedule.time} - {selectedSchedule.endTime}</span>
                         </div>
                         <div>
                             <span className="block text-slate-500">Ruangan</span>
                             <span className="font-medium">{selectedSchedule.room}</span>
                         </div>
                     </div>
                     
                     {selectedSchedule.status === 'upcoming' ? (
                         <>
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-4">
                                <h3 className="text-purple-800 font-bold mb-2">Selesai Sidang</h3>
                                <p className="text-sm text-purple-600 mb-4">Klik jika sidang selesai. Status mahasiswa akan dikirim ke Admin Pustaka untuk proses Revisi.</p>
                                <button type="button" onClick={handlePassExam} className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 active:scale-95 transform transition">Selesai Sidang</button>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <h3 className="text-red-800 font-bold mb-2">Reset Status / Batal</h3>
                                <p className="text-sm text-red-600 mb-4">Kembalikan ke status Ditolak/Perlu Revisi (Jadwal dihapus permanen).</p>
                                <button type="button" onClick={handleResetSchedule} className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 active:scale-95 transform transition">Reset Jadwal</button>
                            </div>
                         </>
                     ) : (
                         <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-slate-500 italic">
                             Jadwal ini sudah selesai.
                         </div>
                     )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
