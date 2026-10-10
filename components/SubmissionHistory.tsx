import React from 'react';
import { History } from 'lucide-react';
import { Schedule, Submission } from '../types';
import { getAttemptNumber, sortByAttempt } from '../services/mockDb';

// Riwayat pendaftaran ujian (khusus admin): semua percobaan satu mahasiswa untuk
// satu tahap, termasuk yang dinyatakan tidak lulus.
interface SubmissionHistoryProps {
  current: Submission;
  submissions: Submission[];
  schedules: Schedule[];
}

const formatDate = (value: any) => {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusText = (sub: Submission) => {
  switch (sub.status) {
    case 'failed': return 'Tidak Lulus';
    case 'pending': return 'Menunggu Validasi';
    case 'rejected': return 'Berkas Ditolak';
    case 'validated': return 'Antrian Jadwal';
    case 'scheduled': return 'Terjadwal';
    case 'revision_proposal_pending':
    case 'revision_skripsi_pending': return 'Lulus, Proses Revisi';
    case 'proposal_completed':
    case 'skripsi_completed': return 'Lulus / Selesai';
    default: return sub.status;
  }
};

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({ current, submissions, schedules }) => {
  const attempts = sortByAttempt(
    submissions.filter(s => s.studentNpm === current.studentNpm && s.type === current.type)
  );

  // Hanya tampil jika mahasiswa pernah mengulang ujian.
  if (attempts.length <= 1) return null;

  return (
    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 flex items-center gap-2">
        <History size={16} /> Riwayat Pendaftaran {current.type === 'proposal' ? 'Seminar Proposal' : 'Sidang Skripsi'} ({attempts.length} percobaan)
      </div>
      <ul className="divide-y divide-slate-100">
        {attempts.map(sub => {
          const isCurrent = sub.id === current.id;
          const examSchedules = schedules.filter(sch => sch.submissionId === sub.id);
          return (
            <li key={sub.id} className={`px-4 py-3 text-sm ${isCurrent ? 'bg-indigo-50/50' : ''}`}>
              <div className="flex justify-between items-center gap-2">
                <span className="font-semibold text-slate-800">
                  Percobaan ke-{getAttemptNumber(sub)} {isCurrent && <span className="text-xs text-indigo-600 font-normal">(dipilih)</span>}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${sub.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                  {statusText(sub)}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                <div>Daftar: {formatDate(sub.submittedAt)}{sub.academicYear ? ` • TA ${sub.academicYear}` : ''}</div>
                {examSchedules.map(sch => (
                  <div key={sch.id}>Ujian: {formatDate(sch.date)}, {sch.time}-{sch.endTime} • {sch.room}</div>
                ))}
                {sub.status === 'failed' && (
                  <div className="text-red-600">Dinyatakan tidak lulus {formatDate(sub.failedAt)}{sub.failReason ? `: ${sub.failReason}` : ''}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
