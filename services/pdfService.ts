
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from './mockDb';
import { getAllStudents } from './studentService';
import { format } from 'path';

// Helper to format date
const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
};

export const generateStudentReport = async () => {
    const doc = new jsPDF();
    const students = await getAllStudents();

    doc.setFontSize(18);
    doc.text('Laporan Data Induk Mahasiswa', 14, 22);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 30);

    const tableData = students.map(s => [
        s.npm,
        s.nama,
        s.prodi,
        s.judul_skripsi || '-'
    ]);

    autoTable(doc, {
        head: [['NPM', 'Nama', 'Prodi', 'Judul Skripsi']],
        body: tableData,
        startY: 35,
    });

    doc.save(`Laporan_Data_Mahasiswa_${Date.now()}.pdf`);
};

export const generateSubmissionReport = async () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
    const submissions = await db.getSubmissions();

    doc.setFontSize(18);
    doc.text('Laporan Pendaftaran & Berkas', 14, 22);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 30);

    const tableData = submissions.map(s => {
        // Collect links
        const fileLinks = Object.keys(s.files).map(key => {
            const f = s.files[key];
            return f?.driveUrl ? `[${key}]: ${f.driveUrl}` : '';
        }).filter(l => l).join('\n');

        return [
            s.studentNpm,
            s.studentName,
            s.type.toUpperCase(),
            s.status,
            formatDate(s.submittedAt),
            fileLinks // This will be text, clickable if PDF viewer supports auto-link detection, or user copies it
        ];
    });

    autoTable(doc, {
        head: [['NPM', 'Nama', 'Jenis', 'Status', 'Tanggal Submit', 'Link Berkas (Google Drive)']],
        body: tableData,
        startY: 35,
        columnStyles: {
            5: { cellWidth: 100, fontSize: 8 } // Make file column wider
        },
        styles: { overflow: 'linebreak' }
    });

    doc.save(`Laporan_Pendaftaran_${Date.now()}.pdf`);
};

export const generateScheduleReport = async () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
    const schedules = await db.getSchedules();

    doc.setFontSize(18);
    doc.text('Laporan Jadwal Sidang & Seminar', 14, 22);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 30);

    const tableData = schedules.map(s => [
        s.date,
        `${s.time} - ${s.endTime}`,
        s.room,
        s.studentName,
        s.type.toUpperCase(),
        `P1: ${s.pembimbing1}\nP2: ${s.pembimbing2}`,
        `U1: ${s.penguji1}\nU2: ${s.penguji2}`,
        s.status === 'completed' ? 'Selesai' : 'Terjadwal'
    ]);

    autoTable(doc, {
        head: [['Tanggal', 'Jam', 'Ruang', 'Mahasiswa', 'Jenis', 'Pembimbing', 'Penguji', 'Status']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 9 }
    });

    doc.save(`Laporan_Jadwal_${Date.now()}.pdf`);
};

export const generateFullReport = async () => {
    const doc = new jsPDF();
    
    // COVER PAGE
    doc.setFontSize(24);
    doc.text('LAPORAN LENGKAP SISTEM SKRIPSI', 105, 100, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 105, 115, { align: 'center' });
    doc.addPage();

    // 1. DATA MAHASISWA SECTION
    doc.setFontSize(16);
    doc.text('1. Data Induk Mahasiswa', 14, 20);
    const students = await getAllStudents();
    const studentData = students.map(s => [s.npm, s.nama, s.prodi]);
    autoTable(doc, {
        head: [['NPM', 'Nama', 'Prodi']],
        body: studentData,
        startY: 25,
    });

    doc.addPage();

    // 2. JADWAL SECTION
    doc.setFontSize(16);
    doc.text('2. Jadwal Sidang & Seminar', 14, 20);
    const schedules = await db.getSchedules();
    const scheduleData = schedules.map(s => [
        s.date, 
        s.time, 
        s.room, 
        s.studentName, 
        s.type.toUpperCase(), 
        s.status
    ]);
    autoTable(doc, {
        head: [['Tanggal', 'Jam', 'Ruang', 'Mahasiswa', 'Jenis', 'Status']],
        body: scheduleData,
        startY: 25,
    });

    doc.addPage();

    // 3. PENDAFTARAN & LINKS
    doc.setFontSize(16);
    doc.text('3. Detail Pendaftaran & Link Berkas', 14, 20);
    const submissions = await db.getSubmissions();
    const subData = submissions.map(s => {
        const fileLinks = Object.keys(s.files).map(key => {
            const f = s.files[key];
            return f?.driveUrl ? `[${key}]: ${f.driveUrl}` : '';
        }).filter(l => l).join('\n');

        return [s.studentName, s.type, s.status, fileLinks];
    });

    autoTable(doc, {
        head: [['Nama', 'Jenis', 'Status', 'File Links']],
        body: subData,
        startY: 25,
        columnStyles: { 3: { cellWidth: 80, fontSize: 8 } },
        styles: { overflow: 'linebreak' }
    });

    doc.save(`Laporan_Lengkap_Sistem_${Date.now()}.pdf`);
};

export const generateStudentSubmissionReport = async (npm: string, type: 'proposal' | 'revision_proposal' | 'skripsi' | 'revision_skripsi' | 'all') => {
    const doc = new jsPDF();
    const students = await getAllStudents();
    const student = students.find(s => s.npm === npm);
    
    if (!student) {
        alert("Mahasiswa tidak ditemukan.");
        return;
    }

    const submissions = await db.getSubmissions();
    const studentSubs = submissions.filter(s => s.studentNpm === npm);

    doc.setFontSize(18);
    doc.text(`Rekapitulasi Berkas Pendaftaran`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Nama: ${student.nama}`, 14, 32);
    doc.text(`NPM: ${student.npm}`, 14, 38);
    doc.text(`Program Studi: ${student.prodi}`, 14, 44);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 52);

    let startY = 60;

    const renderSubmission = async (subType: 'proposal' | 'skripsi', isRevision: boolean, title: string) => {
        const sub = studentSubs.find(s => s.type === subType);
        if (!sub) return;

        // Skip if we only want revision but status doesn't include it, or vice versa
        // Actually, the files are all in the same submission object, just different keys based on requirements.
        
        let reqs = [];
        if (isRevision) {
            reqs = await db.getRevisionRequirements(subType);
        } else {
            reqs = await db.getRequirements(subType);
        }

        const tableData = reqs.map(req => {
            const file = sub.files[req.id];
            const status = sub.validations[req.id]?.isValid === true ? 'Valid' : (sub.validations[req.id]?.isValid === false ? 'Ditolak' : 'Menunggu');
            const notes = sub.validations[req.id]?.notes || '-';
            return [
                req.label,
                file ? 'Ada' : 'Tidak Ada',
                status,
                notes,
                file?.driveUrl || '-'
            ];
        });

        if (tableData.length > 0) {
            doc.setFontSize(14);
            doc.text(title, 14, startY);
            autoTable(doc, {
                head: [['Nama Berkas', 'Status Upload', 'Validasi', 'Catatan', 'Link File']],
                body: tableData,
                startY: startY + 5,
                columnStyles: { 4: { cellWidth: 50, fontSize: 8 } },
                styles: { overflow: 'linebreak' }
            });
            startY = (doc as any).lastAutoTable.finalY + 15;
        }
    };

    if (type === 'proposal' || type === 'all') {
        await renderSubmission('proposal', false, '1. Pendaftaran Seminar Proposal');
    }
    if (type === 'revision_proposal' || type === 'all') {
        await renderSubmission('proposal', true, '2. Revisi Seminar Proposal');
    }
    if (type === 'skripsi' || type === 'all') {
        await renderSubmission('skripsi', false, '3. Pendaftaran Sidang Skripsi');
    }
    if (type === 'revision_skripsi' || type === 'all') {
        await renderSubmission('skripsi', true, '4. Revisi Sidang Skripsi');
    }

    doc.save(`Rekap_Berkas_${student.npm}_${type}.pdf`);
};
