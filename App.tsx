
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard'; 
import { RegistrationHub } from './pages/RegistrationHub';
import { ScheduleStatus } from './pages/ScheduleStatus';
import { FormPage } from './pages/FormPage';
import { RevisionPage } from './pages/RevisionPage';
import { AdminValidation } from './pages/AdminValidation';
import { AdminScheduling } from './pages/AdminScheduling';
import { AdminSettings } from './pages/AdminSettings';
import { AdminReports } from './pages/AdminReports'; 
import { AdminProgress } from './pages/AdminProgress';
import { LibraryAdmin } from './pages/LibraryAdmin';
import { Assistant } from './components/Assistant';
import { PageView } from './types';
import { db } from './services/mockDb';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [adminRole, setAdminRole] = useState<'none' | 'main' | 'library'>('none');
  const [hasNotifications, setHasNotifications] = useState(false);
  const [dataVersion, setDataVersion] = useState(0); 

  useEffect(() => {
     const checkNotifications = async () => {
         const schedules = await db.getUpcomingSchedules();
         const submissions = await db.getSubmissions();
         
         const actionableSubmissions = submissions.filter(sub => {
             if (sub.status === 'rejected') return true;
             if (sub.status.includes('revision')) {
                 return Object.values(sub.validations).some(v => v.isValid === false);
             }
             return false;
         });

         const currentCount = schedules.length + actionableSubmissions.length;
         const storedState = localStorage.getItem('appNotificationState');
         let state = storedState ? JSON.parse(storedState) : { count: 0, timestamp: Date.now() };

         let showDot = false;
         const ONE_DAY_MS = 24 * 60 * 60 * 1000;

         if (currentCount === 0) {
             showDot = false;
             state = { count: 0, timestamp: Date.now() };
         } else if (currentCount > state.count) {
             showDot = true;
             state = { count: currentCount, timestamp: Date.now() };
         } else if (currentCount === state.count) {
             const isExpired = Date.now() - state.timestamp > ONE_DAY_MS;
             showDot = !isExpired;
         } else {
             const isExpired = Date.now() - state.timestamp > ONE_DAY_MS;
             showDot = !isExpired;
             state.count = currentCount; 
         }

         localStorage.setItem('appNotificationState', JSON.stringify(state));
         setHasNotifications(showDot);
     };

     // This used to poll every 60 seconds for as long as the tab existed, re-reading
     // whole Firestore collections around the clock even with nobody using the app.
     // It now refreshes on a slow interval and only while the tab is actually
     // visible, so a forgotten background tab costs nothing. Navigating between
     // pages still re-runs this effect, and the read cache keeps that near-free.
     const REFRESH_MS = 15 * 60 * 1000;
     const MIN_GAP_MS = 5 * 60 * 1000;
     let lastCheckedAt = 0;

     const runCheck = () => {
         lastCheckedAt = Date.now();
         checkNotifications();
     };

     const refreshIfVisible = () => {
         if (document.visibilityState !== 'visible') return;
         if (Date.now() - lastCheckedAt < MIN_GAP_MS) return;
         runCheck();
     };

     runCheck();
     const interval = setInterval(refreshIfVisible, REFRESH_MS);
     // Bring the badge up to date the moment the user comes back to the tab.
     document.addEventListener('visibilitychange', refreshIfVisible);

     return () => {
         clearInterval(interval);
         document.removeEventListener('visibilitychange', refreshIfVisible);
     };

  }, [currentPage, adminRole, dataVersion]);

  const handleGlobalUpdate = () => {
      setDataVersion(prev => prev + 1);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'registration-hub':
        return <RegistrationHub onNavigate={setCurrentPage} />;
      case 'schedule-status':
        return <ScheduleStatus />;
      case 'proposal':
        return (
          <FormPage
            pageId="proposal"
            title="Pendaftaran Seminar Proposal"
            description="Lengkapi formulir di bawah ini untuk mendaftar Seminar Proposal."
            onBack={() => setCurrentPage('registration-hub')}
          />
        );
      case 'skripsi':
        return (
          <FormPage
            pageId="skripsi"
            title="Pendaftaran Sidang Skripsi"
            description="Pastikan seluruh persyaratan telah terpenuhi sebelum mengajukan Sidang Skripsi."
            onBack={() => setCurrentPage('registration-hub')}
          />
        );
      case 'revision-proposal':
        return (
          <RevisionPage
             type="proposal"
             title="Pengumpulan Revisi Seminar Proposal"
             onBack={() => setCurrentPage('registration-hub')}
          />
        );
      case 'revision-skripsi':
        return (
            <RevisionPage
                type="skripsi"
                title="Pengumpulan Revisi Sidang Skripsi"
                onBack={() => setCurrentPage('registration-hub')}
            />
        );
      case 'admin-validation':
        return <AdminValidation />;
      case 'admin-scheduling':
        return <AdminScheduling />;
      case 'admin-settings':
        return <AdminSettings onDataChange={handleGlobalUpdate} />;
      case 'admin-reports':
        return <AdminReports />;
      case 'admin-progress':
        return <AdminProgress />;
      case 'library-admin':
        return <LibraryAdmin />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  const handleRoleChange = (role: 'none' | 'main' | 'library') => {
      setAdminRole(role);
      
      if (role === 'main') {
          setCurrentPage('admin-validation');
      } else if (role === 'library') {
          setCurrentPage('library-admin');
      } else {
          setCurrentPage('dashboard');
      }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      adminRole={adminRole}
      onRoleChange={handleRoleChange}
      hasNotifications={hasNotifications}
    >
      <div key={`${currentPage}-${dataVersion}`} className="w-full">
        {renderContent()}
      </div>
      
      {adminRole === 'none' && <Assistant />}
    </Layout>
  );
};

export default App;
