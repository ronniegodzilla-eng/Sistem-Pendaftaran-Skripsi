import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { getAllStudents } from '../services/studentService';
import { Student, Submission } from '../types';
import { Loader2, Search, FileDown, ChevronDown, ChevronUp, User } from 'lucide-react';
import * as XLSX from 'xlsx';

const PROGRESS_STAGES = [
  'Belum Mendaftar Proposal',
  'Sudah Mendaftar (Belum Terjadwal Proposal)',
  'Sudah Terjadwal Proposal',
  'Selesai Proposal (Belum Kumpul Revisi)',
  'Belum Mendaftar Skripsi',
  'Sudah Mendaftar (Belum Terjadwal Skripsi)',
  'Sudah Terjadwal Skripsi',
  'Selesai Skripsi (Belum Kumpul Revisi)',
  'Tuntas (Selesai Semua)'
] as const;

type ProgressStage = typeof PROGRESS_STAGES[number];

interface ProdiStats {
  prodiName: string;
  totalStudents: number;
  stageCounts: Record<ProgressStage, number>;
  studentsByStage: Record<ProgressStage, Student[]>;
}

export const AdminProgress: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [statsByProdi, setStatsByProdi] = useState<Record<string, ProdiStats>>({});
    const [expandedProdi, setExpandedProdi] = useState<string | null>(null);
    const [expandedStage, setExpandedStage] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [allStudents, allSubmissions] = await Promise.all([
                    getAllStudents(),
                    db.getSubmissions()
                ]);

                const prodiMap: Record<string, ProdiStats> = {};

                // Initialize map
                allStudents.forEach(student => {
                    const prodi = student.prodi || 'Unassigned';
                    if (!prodiMap[prodi]) {
                        prodiMap[prodi] = {
                            prodiName: prodi,
                            totalStudents: 0,
                            stageCounts: {} as Record<ProgressStage, number>,
                            studentsByStage: {} as Record<ProgressStage, Student[]>
                        };
                        PROGRESS_STAGES.forEach(stage => {
                            prodiMap[prodi].stageCounts[stage] = 0;
                            prodiMap[prodi].studentsByStage[stage] = [];
                        });
                    }
                });

                // Calculate states
                allStudents.forEach(student => {
                    const prodi = student.prodi || 'Unassigned';
                    const submissions = allSubmissions.filter(s => s.studentNpm === student.npm);
                    const stage = getStudentStage(student, submissions);
                    
                    prodiMap[prodi].totalStudents += 1;
                    prodiMap[prodi].stageCounts[stage] += 1;
                    prodiMap[prodi].studentsByStage[stage].push(student);
                });

                setStatsByProdi(prodiMap);
                
                // Expand first prodi by default if available
                const prodis = Object.keys(prodiMap);
                if (prodis.length > 0) {
                    setExpandedProdi(prodis[0]);
                }
            } catch (err) {
                console.warn("Failed to load progress data", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const getStudentStage = (student: Student, submissions: Submission[]): ProgressStage => {
        const sempro = submissions.find(s => s.type === 'proposal');
        const skripsi = submissions.find(s => s.type === 'skripsi');

        if (skripsi) {
            if (skripsi.status === 'skripsi_completed') return 'Tuntas (Selesai Semua)';
            if (skripsi.status === 'revision_skripsi_pending') return 'Selesai Skripsi (Belum Kumpul Revisi)';
            if (skripsi.status === 'scheduled') return 'Sudah Terjadwal Skripsi';
            return 'Sudah Mendaftar (Belum Terjadwal Skripsi)'; 
        }

        if (sempro) {
            if (sempro.status === 'proposal_completed') return 'Belum Mendaftar Skripsi'; 
            if (sempro.status === 'revision_proposal_pending') return 'Selesai Proposal (Belum Kumpul Revisi)';
            if (sempro.status === 'scheduled') return 'Sudah Terjadwal Proposal';
            return 'Sudah Mendaftar (Belum Terjadwal Proposal)'; 
        }

        if (student.bypassProposal) {
            return 'Belum Mendaftar Skripsi';
        }

        return 'Belum Mendaftar Proposal';
    };

    const downloadExcel = () => {
        const wb = XLSX.utils.book_new();

        Object.values(statsByProdi).forEach(prodiStat => {
            const rows: any[] = [];
            PROGRESS_STAGES.forEach(stage => {
                const students = prodiStat.studentsByStage[stage];
                students.forEach(student => {
                    rows.push({
                        'NPM': student.npm,
                        'Nama': student.nama,
                        'Prodi': student.prodi,
                        'Tahap Progres': stage,
                    });
                });
            });

            const safeSheetName = prodiStat.prodiName.substring(0, 31).replace(/[\\/*?:\[\]]/g, '');
            const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Pesan: "Tidak ada data" }]);
            XLSX.utils.book_append_sheet(wb, ws, safeSheetName || 'Data');
        });

        XLSX.writeFile(wb, `Rekap_Progres_Mahasiswa_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-slate-600">Terhubung ke Database...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Tracking Progres Mahasiswa</h2>
                    <p className="text-slate-600">Rekapitulasi status pendaftaran dan jadwal mahasiswa per program studi.</p>
                </div>
                <button
                    onClick={downloadExcel}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                    <FileDown size={18} />
                    Export Excel
                </button>
            </div>

            <div className="space-y-4">
                {Object.values(statsByProdi).map((prodiStat) => {
                    const isExpanded = expandedProdi === prodiStat.prodiName;

                    return (
                        <div key={prodiStat.prodiName} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <button
                                onClick={() => setExpandedProdi(isExpanded ? null : prodiStat.prodiName)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex flex-col text-left">
                                    <h3 className="text-lg font-bold text-slate-800">{prodiStat.prodiName}</h3>
                                    <span className="text-sm text-slate-500">Total: {prodiStat.totalStudents} Mahasiswa</span>
                                </div>
                                {isExpanded ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                            </button>

                            {isExpanded && (
                                <div className="p-4 border-t border-slate-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                        {PROGRESS_STAGES.map(stage => {
                                            const count = prodiStat.stageCounts[stage];
                                            return (
                                                <div key={stage} className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col justify-between">
                                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stage}</span>
                                                    <span className="text-3xl font-bold text-indigo-700 mt-2">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <h4 className="font-bold text-slate-700 mb-4 pb-2 border-b">Detail Mahasiswa per Tahapan</h4>
                                    <div className="space-y-3">
                                        {PROGRESS_STAGES.map(stage => {
                                            const students = prodiStat.studentsByStage[stage];
                                            if (students.length === 0) return null;

                                            const stageKey = `${prodiStat.prodiName}-${stage}`;
                                            const isStageExpanded = expandedStage === stageKey;

                                            return (
                                                <div key={stageKey} className="border border-slate-200 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => setExpandedStage(isStageExpanded ? null : stageKey)}
                                                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                                                {students.length}
                                                            </div>
                                                            <span className="font-semibold text-slate-700 text-sm">{stage}</span>
                                                        </div>
                                                        {isStageExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                                    </button>
                                                    
                                                    {isStageExpanded && (
                                                        <div className="p-3 bg-white border-t border-slate-200">
                                                            <div className="max-h-60 overflow-y-auto pr-2">
                                                                <ul className="space-y-2">
                                                                    {students.map(s => (
                                                                        <li key={s.npm} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100">
                                                                            <div className="bg-slate-100 p-2 rounded-full">
                                                                                <User size={16} className="text-slate-500" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-semibold text-slate-800">{s.nama}</span>
                                                                                <span className="text-xs text-slate-500">{s.npm}</span>
                                                                            </div>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {Object.keys(statsByProdi).length === 0 && (
                    <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200">
                        <p className="text-slate-500">Belum ada data mahasiswa yang dapat ditampilkan.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
