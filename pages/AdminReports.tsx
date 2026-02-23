
import React, { useState, useEffect, useRef } from 'react';
import { FileText, Users, Calendar, Archive, Download, Search, Loader2, X } from 'lucide-react';
import { generateStudentReport, generateSubmissionReport, generateScheduleReport, generateFullReport, generateStudentSubmissionReport } from '../services/pdfService';
import { searchStudentsByName } from '../services/studentService';
import { Student } from '../types';

export const AdminReports: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
    if (student) {
        setStudent(null);
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

  const handleSelectStudent = (selected: Student) => {
      setStudent(selected);
      setSearchInput(selected.nama);
      setSuggestions([]);
  };

  const clearSelection = () => {
      setStudent(null);
      setSearchInput('');
      setSuggestions([]);
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pusat Laporan & Data</h1>
        <p className="text-slate-600">Unduh rekapitulasi data sistem dalam format PDF.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card: Laporan per Mahasiswa */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                  <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                      <FileText size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg text-slate-900">Rekapitulasi Berkas per Mahasiswa</h3>
                      <p className="text-sm text-slate-500">Unduh rekap berkas pendaftaran dan revisi untuk satu mahasiswa tertentu.</p>
                  </div>
              </div>
              
              <div className="max-w-xl mb-4" ref={searchContainerRef}>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {isSearching ? <Loader2 className="animate-spin text-slate-400" size={18}/> : <Search className="text-slate-400" size={18}/>}
                      </div>
                      <input 
                          type="text" 
                          value={searchInput}
                          onChange={handleSearchChange}
                          disabled={!!student}
                          placeholder="Cari nama mahasiswa..."
                          className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-shadow ${student ? 'bg-slate-50 border-slate-200 text-slate-500' : 'border-slate-300'}`}
                      />
                      {student && (
                          <button onClick={clearSelection} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                              <X size={18} />
                          </button>
                      )}
                      
                      {!student && suggestions.length > 0 && (
                          <div className="absolute z-50 w-full bg-white mt-1 border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {suggestions.map((s) => (
                                  <button
                                      key={s.npm}
                                      onClick={() => handleSelectStudent(s)}
                                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                                  >
                                      <p className="font-medium text-slate-900 text-sm">{s.nama}</p>
                                      <p className="text-xs text-slate-500">{s.npm} • {s.prodi}</p>
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
              </div>

              {student && (
                  <div className="flex flex-wrap gap-2 animate-fade-in">
                      <button onClick={() => generateStudentSubmissionReport(student.npm, 'proposal')} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                          <Download size={16} /> Proposal
                      </button>
                      <button onClick={() => generateStudentSubmissionReport(student.npm, 'revision_proposal')} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                          <Download size={16} /> Revisi Proposal
                      </button>
                      <button onClick={() => generateStudentSubmissionReport(student.npm, 'skripsi')} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                          <Download size={16} /> Skripsi
                      </button>
                      <button onClick={() => generateStudentSubmissionReport(student.npm, 'revision_skripsi')} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                          <Download size={16} /> Revisi Skripsi
                      </button>
                      <button onClick={() => generateStudentSubmissionReport(student.npm, 'all')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                          <Download size={16} /> Keseluruhan
                      </button>
                  </div>
              )}
          </div>

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
