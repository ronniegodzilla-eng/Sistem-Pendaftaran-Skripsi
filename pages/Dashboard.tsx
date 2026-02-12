
import React, { useEffect, useState } from 'react';
import { Calendar, Bell, AlertTriangle, Users, Award, BookOpen, Clock, FileWarning, CheckCircle, Loader2, ArrowRight, FileText } from 'lucide-react';
import { PageView, Schedule, Submission } from '../types';
import { db } from '../services/mockDb';

interface DashboardProps {
  onNavigate: (page: PageView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
  const [overdueRevisions, setOverdueRevisions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
      total: 0,
      proposal_passed: 0,
      skripsi_passed: 0,
      pending_revision: 0,
      upcoming_exams: 0
  });

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const up = await db.getUpcomingSchedules(3);
            const ov = await db.getOverdueRevisions();
            const st = await db.getStats();
            setUpcomingSchedules(up);
            setOverdueRevisions(ov);
            setStats(st);
        } catch (e) {
            console.error("Failed to load dashboard data", e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  if (loading) {
      return (
          <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. HERO / STATS SECTION */}
      <div>
          <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Beranda Akademik</h1>
                <p className="text-slate-600 mb-6">Ringkasan aktivitas seminar dan sidang skripsi.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors">
                  <div className="bg-blue-100 p-2 rounded-full mb-2 text-blue-600">
                      <Users size={24} />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Total Pendaftar</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors">
                  <div className="bg-green-100 p-2 rounded-full mb-2 text-green-600">
                      <CheckCircle size={24} />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{stats.proposal_passed}</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Lulus Sempro</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors">
                  <div className="bg-purple-100 p-2 rounded-full mb-2 text-purple-600">
                      <Award size={24} />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{stats.skripsi_passed}</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Lulus Skripsi</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors">
                  <div className="bg-orange-100 p-2 rounded-full mb-2 text-orange-600">
                      <Clock size={24} />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{stats.pending_revision}</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Dalam Revisi</span>
              </div>
          </div>
      </div>

      {/* 2. REGISTRATION CALL TO ACTION */}
      <div 
        onClick={() => onNavigate('registration-hub')}
        className="bg-indigo-600 rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all"
      >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 bg-white/10 w-40 h-40 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
          <div className="relative z-10 flex items-center gap-4 mb-4 md:mb-0">
              <div className="bg-white/20 p-3 rounded-full">
                  <FileText size={32} className="text-white" />
              </div>
              <div className="text-center md:text-left">
                  <h2 className="text-xl font-bold">Pendaftaran Sidang & Seminar</h2>
                  <p className="text-indigo-100 text-sm">Ajukan proposal atau skripsi Anda sekarang dengan mudah.</p>
              </div>
          </div>
          <div className="relative z-10">
              <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-bold shadow-sm hover:bg-indigo-50 transition-colors flex items-center gap-2">
                  Daftar Sekarang <ArrowRight size={18} />
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 3. NOTIFIKASI JADWAL TERDEKAT */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-white/10 w-32 h-32 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                      <Calendar className="animate-pulse" size={20} /> Jadwal Sidang/Seminar (3 Hari)
                  </h3>
                  
                  {upcomingSchedules.length === 0 ? (
                      <div className="bg-white/10 rounded-lg p-4 text-center text-indigo-100">
                          Tidak ada jadwal dalam 3 hari kedepan.
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {upcomingSchedules.slice(0, 3).map(sch => (
                              <div key={sch.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 flex justify-between items-center">
                                  <div>
                                      <p className="font-bold text-sm truncate w-48">{sch.studentName}</p>
                                      <span className="text-xs text-indigo-200">{sch.type === 'proposal' ? 'Sempro' : 'Sidang'} • {sch.date}</span>
                                  </div>
                                  <div className="text-right">
                                      <div className="bg-white text-indigo-700 px-2 py-1 rounded text-xs font-bold">
                                          {sch.time}
                                      </div>
                                      <p className="text-[10px] mt-1 text-indigo-200">{sch.room}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                  
                  <button 
                    onClick={() => onNavigate('schedule-status')}
                    className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
                  >
                      Lihat Semua Jadwal
                  </button>
              </div>
          </div>

          {/* 4. PERINGATAN REVISI TERLAMBAT */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                  <h3 className="text-red-800 font-bold flex items-center gap-2">
                      <AlertTriangle size={20} /> Peringatan Revisi (&gt;7 Hari)
                  </h3>
                  <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full font-bold">
                      {overdueRevisions.length} Mahasiswa
                  </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                  {overdueRevisions.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                          <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                          Tidak ada mahasiswa yang terlambat mengumpulkan revisi.
                      </div>
                  ) : (
                      overdueRevisions.map(sub => (
                          <div key={sub.id} className="p-4 hover:bg-red-50/20 transition-colors">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <p className="font-bold text-slate-900 text-sm">{sub.studentName}</p>
                                      <p className="text-xs text-slate-500">{sub.studentNpm}</p>
                                  </div>
                                  <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded">
                                      Terlambat
                                  </span>
                              </div>
                              <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                  Status: {sub.status === 'revision_proposal_pending' ? 'Pasca Sempro' : 'Pasca Sidang'} - Belum Kumpul
                              </p>
                          </div>
                      ))
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};
