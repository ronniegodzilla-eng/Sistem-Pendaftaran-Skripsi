
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Schedule, Submission } from '../types';
import { Search, Calendar, Clock, X, AlertCircle, FileText, CheckCircle2, Loader2 } from 'lucide-react';

export const ScheduleStatus: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'status'>('schedule');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedReason, setSelectedReason] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const loadedSchedules = await db.getSchedules();
        const loadedSubmissions = await db.getSubmissions();
        setSchedules(loadedSchedules);
        setSubmissions(loadedSubmissions);
        setLoading(false);
    };
    fetchData();
  }, []);

  const getStatusLabel = (item: Submission) => {
      const hasRejections = Object.values(item.validations).some(v => v.isValid === false);

      switch(item.status) {
          case 'scheduled': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Terjadwal</span>;
          
          case 'revision_proposal_pending': 
          case 'revision_skripsi_pending': 
            if (hasRejections) {
                return (
                    <button 
                        onClick={() => setSelectedReason(item)}
                        className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-red-200 transition-colors"
                    >
                        <AlertCircle size={12} /> Revisi Ditolak (Lihat)
                    </button>
                );
            }
            return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Menunggu Validasi Pustaka</span>;

          case 'proposal_completed': 
          case 'skripsi_completed': 
            return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Lulus / Selesai</span>;
          
          case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Menunggu Validasi Admin</span>;
          
          case 'rejected': 
            return (
                <button 
                    onClick={() => setSelectedReason(item)}
                    className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-red-200 transition-colors"
                >
                    <AlertCircle size={12} /> Pendaftaran Ditolak
                </button>
            );
          
          case 'validated': return <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">Valid (Antrian Jadwal)</span>;
          
          default: return <span className="text-xs">{item.status}</span>;
      }
  };

  const getRejectedFiles = (sub: Submission) => {
      const isRevisionContext = sub.status.includes('revision') || sub.status.includes('completed');
      const reqs = isRevisionContext 
        ? db.getRevisionRequirements(sub.type)
        : db.getRequirements(sub.type);

      return reqs.filter(r => sub.validations[r.id]?.isValid === false);
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Informasi Akademik</h1>
            <p className="text-slate-600 text-sm">Lihat jadwal sidang atau pantau status pendaftaran.</p>
          </div>
          
          <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari Nama / NPM..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      <X size={18} />
                  </button>
              )}
          </div>
      </div>

      <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
        <button 
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'schedule' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
            <Calendar size={18} /> Jadwal Sidang
        </button>
        <button 
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'status' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
            <CheckCircle2 size={18} /> Status Pendaftaran
        </button>
      </div>

      <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
          {loading ? (
              <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-400"/></div>
          ) : (
            activeTab === 'schedule' ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Mahasiswa</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Jenis</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Jadwal</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Ruang</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Dosen</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {schedules.filter(s => s.studentName.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">Tidak ada jadwal.</td></tr>
                            ) : (
                                schedules.filter(s => s.studentName.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900">{item.studentName}</p>
                                        </td>
                                        <td className="px-6 py-4"><span className="text-xs font-bold uppercase">{item.type}</span></td>
                                        <td className="px-6 py-4 text-sm">{item.date} <br/><span className="text-slate-500">{item.time}-{item.endTime}</span></td>
                                        <td className="px-6 py-4 text-sm">{item.room}</td>
                                        <td className="px-6 py-4 text-xs text-slate-600">P1: {item.pembimbing1}<br/>P2: {item.pembimbing2}</td>
                                        <td className="px-6 py-4">
                                            {item.status === 'completed' ? <span className="text-xs bg-slate-200 px-2 py-1 rounded font-bold">Selesai</span> : <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">Upcoming</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Nama & NPM</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Tahapan</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Tanggal</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                             {submissions.filter(s => s.studentName.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-4">
                                          <p className="text-sm font-bold">{item.studentName}</p>
                                          <p className="text-xs text-slate-500">{item.studentNpm}</p>
                                      </td>
                                      <td className="px-6 py-4 text-xs font-bold uppercase">{item.type}</td>
                                      <td className="px-6 py-4 text-sm">{new Date(item.submittedAt).toLocaleDateString()}</td>
                                      <td className="px-6 py-4">{getStatusLabel(item)}</td>
                                  </tr>
                             ))}
                        </tbody>
                    </table>
                </div>
            )
          )}
      </div>

      {selectedReason && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl animate-fade-in-up">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-red-600 flex items-center gap-2"><AlertCircle /> Detail Penolakan</h3>
                      <button onClick={() => setSelectedReason(null)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 space-y-3 mb-6 max-h-60 overflow-y-auto">
                      {getRejectedFiles(selectedReason).map(r => (
                          <div key={r.id} className="border-b border-red-100 last:border-0 pb-2">
                              <p className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1"><FileText size={12}/> {r.label}</p>
                              <p className="text-sm text-red-700 mt-1 italic">"{selectedReason.validations[r.id]?.notes || 'Berkas tidak sesuai.'}"</p>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setSelectedReason(null)} className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium">Tutup</button>
              </div>
          </div>
      )}
    </div>
  );
};
