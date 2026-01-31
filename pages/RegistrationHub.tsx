
import React from 'react';
import { PageView } from '../types';
import { FileText, GraduationCap, ArrowRight, BookOpen } from 'lucide-react';

interface RegistrationHubProps {
  onNavigate: (page: PageView) => void;
}

export const RegistrationHub: React.FC<RegistrationHubProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in space-y-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Pendaftaran Akademik</h1>
        <p className="text-slate-600">
          Silakan pilih jenis pendaftaran atau pengumpulan revisi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
        {/* KOLOM SEMINAR PROPOSAL */}
        <div className="space-y-4">
            <button
              onClick={() => onNavigate('proposal')}
              className="w-full group relative bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col items-start min-h-[250px]"
            >
              <div className="bg-indigo-100 p-4 rounded-xl mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
                <FileText className="w-10 h-10 text-indigo-600 group-hover:text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600">Daftar Seminar Proposal</h2>
              <p className="text-slate-500 text-sm mb-6">
                Untuk mahasiswa yang telah menyelesaikan penyusunan proposal (Bab 1-3).
              </p>
              <div className="mt-auto flex items-center text-indigo-600 font-bold text-sm">
                Mulai Pendaftaran <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            
            {/* REVISI SEMPRO - Changed Color to Orange */}
            <button
              onClick={() => onNavigate('revision-proposal')}
              className="w-full bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-xl p-4 flex items-center justify-between text-orange-700 hover:text-orange-900 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <BookOpen size={20} className="text-orange-500 group-hover:text-orange-700"/>
                    <div className="text-left">
                        <span className="block font-bold text-sm">Kumpul Revisi Sempro</span>
                        <span className="text-xs text-orange-600/80">Aktif setelah status "Selesai Sempro"</span>
                    </div>
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-600"/>
            </button>
        </div>

        {/* KOLOM SIDANG SKRIPSI */}
        <div className="space-y-4">
            <button
              onClick={() => onNavigate('skripsi')}
              className="w-full group relative bg-white border border-slate-200 hover:border-green-500 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col items-start min-h-[250px]"
            >
              <div className="bg-green-100 p-4 rounded-xl mb-6 group-hover:bg-green-600 transition-colors duration-300">
                <GraduationCap className="w-10 h-10 text-green-600 group-hover:text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-green-600">Daftar Sidang Skripsi</h2>
              <p className="text-slate-500 text-sm mb-6">
                Untuk mahasiswa yang telah menyelesaikan skripsi dan revisi proposal.
              </p>
              <div className="mt-auto flex items-center text-green-600 font-bold text-sm">
                Mulai Pendaftaran <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

             {/* REVISI SKRIPSI - Changed Color to Emerald/Teal */}
             <button
              onClick={() => onNavigate('revision-skripsi')}
              className="w-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl p-4 flex items-center justify-between text-emerald-700 hover:text-emerald-900 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <BookOpen size={20} className="text-emerald-500 group-hover:text-emerald-700"/>
                    <div className="text-left">
                        <span className="block font-bold text-sm">Kumpul Revisi Sidang</span>
                        <span className="text-xs text-emerald-600/80">Aktif setelah status "Selesai Sidang"</span>
                    </div>
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600"/>
            </button>
        </div>
      </div>
    </div>
  );
};
