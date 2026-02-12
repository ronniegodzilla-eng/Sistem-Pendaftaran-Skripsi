
import { supabase } from './supabase';
import { Student } from '../types';
import * as XLSX from 'xlsx';

// Update version key to ensure fresh logic applies
const STORAGE_KEY_STUDENTS = 'app_students_master_v7';

const RAW_CSV_DATA = `Nama,NPM,Prodi,Judul Skripsi,Pembimbing 1,Pembimbing 2,Penguji 1,Penguji 2
Naily Nur Suliana,K3-2025-001,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Lucy Normayna .N.,K3-2025-002,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Ridho Alfikri,K3-2025-003,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Arif Sofyan,K3-2025-004,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Budi Rasuanto,K3-2025-005,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Edi Nurikhsan,K3-2025-006,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Nanda Rizki,K3-2025-007,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Sastia Ariyanti,K3-2025-008,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Lailan Alfisyah,K3-2025-009,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Sabilla Azelna,K3-2025-010,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Rakeenbolino,K3-2025-011,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
M.Haiqal Eka Putra,K3-2025-012,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Desi Damayanti,K3-2025-013,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Alfiqri S. Ghandi,K3-2025-014,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Darna Febryanti,K3-2025-015,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Defi Febriani,K3-2025-016,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Marlina,K3-2025-017,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Sari Indah Permata Hati,K3-2025-018,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Aymal Ramadani,K3-2025-019,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Farah Amanda Putri,K3-2025-020,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Resta Oldie Aprillia Ngantung,K3-2025-021,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Clawdia Simatupang,K3-2025-022,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Shabrina,K3-2025-023,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Thalia Dame Marinez Simanungkalit,K3-2025-024,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Wahyu Nur Fadilah,K3-2025-025,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Bernadus Steven Marselinus,K3-2025-026,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Mohammad Ihsan Harland Pratama,K3-2025-027,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Ananda Putri Maharani,K3-2025-028,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Fauzan Syahputra,K3-2025-029,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Haikal Rifkie Fachriza,K3-2025-030,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Taufik Qurrahman Saleh,K3-2025-031,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Fayyadh,K3-2025-032,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Cut Alifa Nur Rahmawati,K3-2025-033,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Ignasia Emiliana Bunga,K3-2025-034,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Afdhal Yoga Almaahi,K3-2025-035,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Friska Rahmawati,K3-2025-036,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Alvira Sakinah,K3-2025-037,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Rizky Ramadhan,K3-2025-038,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Gabriel Vicktory Aritonang,K3-2025-039,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Nurul Shyafika,K3-2025-040,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhhamad Rossarions,K3-2025-041,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Nanda Fauzan Azima,K3-2025-042,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Fathir Ramadhanie,K3-2025-043,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Sima Ananda Dila,K3-2025-044,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Lina Setia Ningsih,K3-2025-045,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Witara Manurung,K3-2025-046,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Kiki Andriani,K3-2025-047,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Jilan Sheviolla,K3-2025-048,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Randy Afrelyus,K3-2025-049,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Ummu Zahrah Mutmainnah,K3-2025-050,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Andre Rivaldo,K3-2025-051,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Rio Alnet,K3-2025-052,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
M. Rizki Hidayatulloh,K3-2025-053,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Alya Angel,K3-2025-054,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Siti Yusmida Yanti Nababan,K3-2025-055,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Putra Caesar Zellya,K3-2025-056,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Putri Dayanara Anakami,K3-2025-057,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Mufti Fadillah,K3-2025-058,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Amanda Desiana Fitry A,K3-2025-059,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Firman Rahmadi,K3-2025-060,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Zicko Faizurrahman,K3-2025-061,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Ryan Sadewa Aprimus Z,K3-2025-062,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Raja Daniel S M,K3-2025-063,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Ferdinan Roynaldo Oktaviano Sinaga,K3-2025-064,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Rohid Al Zikry,K3-2025-065,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Robertus Rizky Deardo Barus,K3-2025-066,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Rizki,K3-2025-067,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Rivaldi Christovel Lloyd Warow,K3-2025-068,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Vira Maya Sari,K3-2025-069,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Nia Agustina Siregar,K3-2025-070,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Guntur Julianto Anjani,K3-2025-071,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Radila Aisya Sandra Rusma,K3-2025-072,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Syarifah raisya naziha,K3-2025-073,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Rangga Saputra,K3-2025-074,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Umar,K3-2025-075,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Regina Sari,K3-2025-076,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Liana Ariska,K3-2025-077,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Husnul Khotimah,K3-2025-078,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Abdullah Rahmadi,K3-2025-079,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Lailitha Wahyu Mumpuni,K3-2025-080,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Annastasia Jatayu Aventi,K3-2025-081,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Faizal Fathurrahman Gibyo,K3-2025-082,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Hassen S Koernadi Lubis,K3-2025-083,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Dody Setyawan,K3-2025-084,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Alvin Syahputra,K3-2025-085,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Dina Yulianti,K3-2025-086,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Elyana Natasya,K3-2025-087,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Aprical Yusman,K3-2025-088,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Oktavia Yuliana Sari,K3-2025-089,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
David Richad San S,K3-2025-090,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Agustina Berliana Gultom,K3-2025-091,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Hardi Saputra,K3-2025-092,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Risky Apriyanto,K3-2025-093,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Susi Indriyanti Irma,K3-2025-094,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Erlangga Perdana,K3-2025-095,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Radianto,K3-2025-096,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Sumarhadi Dwi Kurniawan,K3-2025-097,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Endrian Bastiansyah,K3-2025-098,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Firman Hidayat,K3-2025-099,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Gendis Revita Salsabilla,K3-2025-100,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Anggraini Dilla Rahmawati,K3-2025-101,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Antoline Wita Norita Komsary,K3-2025-102,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Tiara Cantika,K3-2025-103,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Thalia Putri,K3-2025-104,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Syarifah aina,K3-2025-105,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Andi Nugroho,K3-2025-106,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Erika,K3-2025-107,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Oktaviani Nur Zarini,K3-2025-108,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Siti Mulya Ripah,K3-2025-109,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Al Kharizsmi,K3-2025-110,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Lutfin Wianda Nasandri,K3-2025-111,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Ilham Hadiid,K3-2025-112,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Amelina Adilla,K3-2025-113,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Ayu Dwi Elkusa,K3-2025-114,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Arfan Faisal,K3-2025-115,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
William Nathan Naibaho,K3-2025-116,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Heti Sintia,K3-2025-117,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Yodita Dwi Larasti,K3-2025-118,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Syukri,K3-2025-119,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Fadhli Maulana,K3-2025-120,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Marisina Butar Butar,K3-2025-121,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Arindha,K3-2025-122,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Yuliana,K3-2025-123,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Jhon Roy Lumban Batu,K3-2025-124,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Kevin Albandas Stela,K3-2025-125,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Mohd Rafie Hadianza Agusta,K3-2025-126,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Yufka Ihsandhika Mahendra,K3-2025-127,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Alfred Cornelius Laia,K3-2025-128,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Henrick Jaya Parsaoran Silalahi,K3-2025-129,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Ady Putra,K3-2025-130,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhamad Rizki Darmawan,K3-2025-131,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Farhan Septian Dwi Syahputra,K3-2025-132,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
M. Saputra Maulana Gumilang,K3-2025-133,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Dina Try Muliyawaty,K3-2025-134,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Arista Melinda Rizalia Putri,K3-2025-135,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Ridho Alif Visti,K3-2025-136,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Riduan Sirait,K3-2025-137,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Ja'far Sodiq,K3-2025-138,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Dinda Ayu Lestari,K3-2025-139,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Rezha,K3-2025-140,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Muhammad Galih Syahputra,K3-2025-141,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Andre Rivaldo,K3-2025-142,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Eko Wardiyanto,K3-2025-143,K3,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Lamtiur Sinaga,241013251042,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Riau Ningsih,241013251037,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Wella Anzahni,241013251030,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Sherly Rosaline Moniaga,241013251031,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Juliana,241013251040,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Vita Dianawati,241013251036,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Riyansyah Amanda Pratama,221013251010,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Aisyah Purma,221013251007,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Syafendri,221013251038,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Deanne Lathifa,221013251021,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Nur Asyikin,221013251018,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Putri Amelia,221013251002,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Mohdhan Zyahrul,221013251027,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
M. Faihans Aliefpiyanda,221013251008,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Reysa pranatasya,221013251019,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
M.Vargas Baraja Biantara,221013251003,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Maria azmuliyansah,221013251016,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Asylla Diva Faradila Munandar,221013251035,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Nurul farra ain,221013251030,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Intan Trianurfa,221013251039,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Salwa Putri Amiza,221013251023,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Yuni triana,221013251031,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Hafidzul Akmal,221013251020,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Erica gina olivia saing,221013251012,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Diandra Khairunnisa,221013251015,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Putri uly na'mah,221013251025,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
Zahra Nur Annisa Apendi Putri,221013251033,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
M. Luthfi Hakka,221013251022,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
TANIA AFRIYANTIKA PRANINGSIH,191013251020,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
LISTA SETIA MARTA,201013251001,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
ULFA LAILATUL KHASANAH,201013251002,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
AZIL GHAFFARI,201013251003,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
MUHAMMAD HUMAM MAJID,201013251017,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
ADELIA MASRURI FAJAR ASRI M.,201013251021,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
ALMAIDA SARI,201013251026,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
ZA'IM ALTOF,211013251002,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
GANDA SURYA,211013251022,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
M. FIKRI BIL KHAIRI,211013251026,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
SAMSUL MA'RIF,211013251037,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2
HERLINA,231013251031,Kesling,-,Dosen P1,Dosen P2,Dosen U1,Dosen U2`;

const parseCSV = (csv: string): Student[] => {
    const lines = csv.split('\n').filter(l => l.trim());
    const data = lines.slice(1).map(line => {
        const cols = line.split(',');
        return {
            nama: cols[0]?.trim() || '',
            npm: cols[1]?.trim() || '',
            prodi: cols[2]?.trim() || '',
            judul_skripsi: cols[3]?.trim() || '-',
            pembimbing_1: cols[4]?.trim() || '',
            pembimbing_2: cols[5]?.trim() || '',
            penguji_1: cols[6]?.trim() || '',
            penguji_2: cols[7]?.trim() || ''
        } as Student;
    });
    return data;
};

// Internal Cache
let cachedStudents: Student[] | null = null;

const loadStudentsFromStorage = (): Student[] => {
    if (typeof window === 'undefined') return [];
    
    // Check if new version key exists
    const stored = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (stored) return JSON.parse(stored);
    
    // Fallback to RAW_CSV_DATA
    const initial = parseCSV(RAW_CSV_DATA);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(initial));
    return initial;
};

const saveStudentsToStorage = (students: Student[]) => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    cachedStudents = students;
};

export const getAllStudents = async (): Promise<Student[]> => {
    // 1. Try Supabase
    if (supabase) {
        const { data, error } = await supabase.from('students').select('*');
        if (!error && data && data.length > 0) {
            cachedStudents = data as Student[];
            saveStudentsToStorage(cachedStudents);
            return cachedStudents;
        }
    }

    // 2. Use Local Storage / Cache
    if (!cachedStudents) {
        cachedStudents = loadStudentsFromStorage();
    }
    
    return new Promise(resolve => setTimeout(() => resolve(cachedStudents || []), 300));
};

export const getStudentByNPM = async (npm: string): Promise<Student | null> => {
    const all = await getAllStudents();
    return all.find(s => s.npm === npm) || null;
};

export const searchStudentsByName = async (name: string): Promise<Student[]> => {
    const all = await getAllStudents();
    const term = name.toLowerCase();
    return all.filter(s => s.nama.toLowerCase().includes(term) || s.npm.includes(term));
};

export const addStudent = async (student: Student): Promise<{ success: boolean; message: string }> => {
    const all = await getAllStudents();
    if (all.some(s => s.npm === student.npm)) {
        return { success: false, message: 'NPM sudah terdaftar!' };
    }
    
    all.push(student);
    saveStudentsToStorage(all);

    if (supabase) {
        await supabase.from('students').insert(student);
    }
    return { success: true, message: 'Berhasil menambah data mahasiswa.' };
};

export const updateStudent = async (npm: string, data: Student): Promise<void> => {
    const all = await getAllStudents();
    const index = all.findIndex(s => s.npm === npm);
    if (index >= 0) {
        all[index] = data;
        saveStudentsToStorage(all);

        if (supabase) {
            await supabase.from('students').update(data).eq('npm', npm);
        }
    }
};

export const deleteStudents = async (npms: string[]): Promise<void> => {
    const all = await getAllStudents();
    const filtered = all.filter(s => !npms.includes(s.npm));
    saveStudentsToStorage(filtered);

    if (supabase) {
        await supabase.from('students').delete().in('npm', npms);
    }
};

export const restoreStudents = async (students: Student[]): Promise<void> => {
    const all = await getAllStudents();
    // Add only if not exists
    const toAdd = students.filter(s => !all.some(exist => exist.npm === s.npm));
    const merged = [...all, ...toAdd];
    saveStudentsToStorage(merged);

    if (supabase && toAdd.length > 0) {
        await supabase.from('students').insert(toAdd);
    }
};

// EXCEL HELPERS
export const parseExcel = (buffer: ArrayBuffer): Student[] => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

    // Helper to safely convert to string and trim
    const safeStr = (val: any) => (val === undefined || val === null) ? '' : String(val).trim();

    return jsonData.map((row: any) => ({
        nama: safeStr(row['Nama'] || row['nama'] || row['NAMA']),
        npm: safeStr(row['NPM'] || row['npm'] || row['Nim'] || row['NIM']),
        prodi: safeStr(row['Prodi'] || row['prodi'] || row['Jurusan']) || 'K3',
        judul_skripsi: safeStr(row['Judul Skripsi'] || row['Judul'] || row['judul']),
        pembimbing_1: safeStr(row['Pembimbing 1'] || row['P1'] || row['p1']),
        pembimbing_2: safeStr(row['Pembimbing 2'] || row['P2'] || row['p2']),
        penguji_1: safeStr(row['Penguji 1'] || row['U1'] || row['u1']),
        penguji_2: safeStr(row['Penguji 2'] || row['U2'] || row['u2'])
    }));
};

export const importStudents = async (newStudents: Student[]): Promise<{ added: number; updated: number }> => {
    // 1. Get freshest data
    let all = await getAllStudents(); 
    let added = 0;
    let updated = 0;

    // Helper for aggressive normalization
    const clean = (str: string) => String(str).toLowerCase().replace(/[^a-z0-9]/g, '');

    newStudents.forEach(excelStudent => {
        const excelNpm = String(excelStudent.npm || '').trim();
        const excelName = String(excelStudent.nama || '').trim();
        
        if (!excelNpm && !excelName) return; 

        // STRATEGY (UPDATED REQUEST): 
        // Priority 1: Match by Name. This allows updating NPMs if the name is found.
        // Priority 2: Match by NPM.
        
        let existingIndex = -1;

        // 1. Try finding by Name (Robust Name match)
        if (excelName) {
            existingIndex = all.findIndex(s => 
                clean(s.nama) === clean(excelName)
            );
        }

        // 2. If not found by Name, try finding by NPM (Exact ID match)
        if (existingIndex === -1 && excelNpm) {
            existingIndex = all.findIndex(s => 
                String(s.npm).trim().toLowerCase() === excelNpm.toLowerCase()
            );
        }

        if (existingIndex !== -1) {
            // UPDATE EXISTING
            // We overwrite ALL fields from Excel to DB
            all[existingIndex] = {
                ...all[existingIndex], // Keep any internal DB fields
                ...excelStudent,       // Overwrite with Excel data
                npm: excelNpm,         // Ensure normalized NPM
                nama: excelName        // Ensure normalized Name
            };
            updated++;
        } else {
            // INSERT NEW
            all.push(excelStudent);
            added++;
        }
    });

    saveStudentsToStorage(all);
    if (supabase) await supabase.from('students').upsert(all);

    return { added, updated };
};

export const downloadExcelTemplate = (existingData?: Student[]) => {
    const data = existingData && existingData.length > 0 ? existingData : [
        {
            nama: 'Contoh Nama',
            npm: 'Contoh NPM',
            prodi: 'K3',
            judul_skripsi: 'Contoh Judul',
            pembimbing_1: 'Nama Dosen',
            pembimbing_2: 'Nama Dosen',
            penguji_1: 'Nama Dosen',
            penguji_2: 'Nama Dosen'
        }
    ];

    const ws = XLSX.utils.json_to_sheet(data.map(s => ({
        'Nama': s.nama,
        'NPM': s.npm,
        'Prodi': s.prodi,
        'Judul Skripsi': s.judul_skripsi,
        'Pembimbing 1': s.pembimbing_1,
        'Pembimbing 2': s.pembimbing_2,
        'Penguji 1': s.penguji_1,
        'Penguji 2': s.penguji_2
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Mahasiswa");
    XLSX.writeFile(wb, "Template_Data_Mahasiswa.xlsx");
};
