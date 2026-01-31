
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
