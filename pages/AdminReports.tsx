
import React from 'react';
import { FileText, Users, Calendar, Archive, Download } from 'lucide-react';
import { generateStudentReport, generateSubmissionReport, generateScheduleReport, generateFullReport } from '../services/pdfService';

export const AdminReports: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pusat Laporan & Data</h1>
        <p className="text-slate-600">Unduh rekapitulasi data sistem dalam format PDF.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Data Mahasiswa */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                      <Users size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg text-slate-900">Data Induk Mahasiswa</h3>
                      <p className="text-sm text-slate-500">Daftar seluruh mahasiswa dan judul skripsi.</p>
                  </div>
              </div>
              <button 
                onClick={() => generateStudentReport()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                  <Download size={18} /> Download Laporan Mahasiswa
              </button>
          </div>

          {/* Card 2: Jadwal */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-600">
                      <Calendar size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg text-slate-900">Laporan Jadwal</h3>
                      <p className="text-sm text-slate-500">Rekap jadwal seminar & sidang (Terjadwal & Selesai).</p>
                  </div>
              </div>
              <button 
                onClick={() => generateScheduleReport()}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                  <Download size={18} /> Download Laporan Jadwal
              </button>
          </div>

          {/* Card 3: Pendaftaran & File */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                  <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                      <FileText size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg text-slate-900">Pendaftaran & Arsip File</h3>
                      <p className="text-sm text-slate-500">Status pendaftaran beserta link Google Drive berkas.</p>
                  </div>
              </div>
              <button 
                onClick={() => generateSubmissionReport()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                  <Download size={18} /> Download Laporan Pendaftaran
              </button>
          </div>

          {/* Card 4: FULL REPORT */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow bg-gradient-to-br from-slate-800 to-slate-900 text-white">
              <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white/20 p-3 rounded-full text-white">
                      <Archive size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg text-white">Laporan Lengkap Sistem</h3>
                      <p className="text-sm text-slate-300">Gabungan semua data dalam satu dokumen PDF.</p>
                  </div>
              </div>
              <button 
                onClick={() => generateFullReport()}
                className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 py-3 rounded-lg hover:bg-slate-100 transition-colors font-bold"
              >
                  <Download size={18} /> Download Semua Data
              </button>
          </div>

      </div>
    </div>
  );
};
