
import React, { useState } from 'react';
import { LayoutDashboard, FileText, GraduationCap, Calendar, CheckSquare, Menu, LogOut, Lock, Settings, BarChart3, ListChecks, Library, BookOpen, ClipboardList, X } from 'lucide-react';
import { PageView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  adminRole: 'none' | 'main' | 'library';
  onRoleChange: (role: 'none' | 'main' | 'library') => void;
  hasNotifications?: boolean; 
  activeYear?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentPage, 
  onNavigate, 
  adminRole, 
  onRoleChange, 
  hasNotifications
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginTargetRole, setLoginTargetRole] = useState<'main' | 'library' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const isAdmin = adminRole !== 'none';

  // Handler for clicking login buttons
  const handleLoginClick = (targetRole: 'main' | 'library') => {
      setLoginTargetRole(targetRole);
      setPasswordInput('');
      setLoginError('');
      setIsLoginModalOpen(true);
      setMobileMenuOpen(false);
  };

  const handleLogout = () => {
      onRoleChange('none');
      setMobileMenuOpen(false);
  };

  const submitLogin = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (loginTargetRole === 'main') {
          if (passwordInput === 'Fikes01132039') {
              onRoleChange('main');
              setIsLoginModalOpen(false);
          } else {
              setLoginError('Password Admin Utama salah.');
          }
      } else if (loginTargetRole === 'library') {
          if (passwordInput === 'Pustaka01132039') {
              onRoleChange('library');
              setIsLoginModalOpen(false);
          } else {
              setLoginError('Password Admin Pustaka salah.');
          }
      }
  };

  const NavItem = ({ page, icon: Icon, label, activePageMatch, hasNotificationDot }: { page: PageView; icon: any; label: string, activePageMatch?: PageView[], hasNotificationDot?: boolean }) => {
    const isActive = currentPage === page || (activePageMatch && activePageMatch.includes(currentPage));
    return (
      <button
        onClick={() => {
          onNavigate(page);
          setMobileMenuOpen(false);
        }}
        className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-medium text-sm whitespace-nowrap ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
        }`}
      >
        <Icon size={18} />
        <span>{label}</span>
        {hasNotificationDot && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER NAVIGATION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${adminRole === 'main' ? 'bg-red-600' : adminRole === 'library' ? 'bg-orange-500' : 'bg-indigo-600'}`}>
                <GraduationCap className="text-white h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900 leading-none">Sistem Skripsi</span>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                  {adminRole === 'main' ? 'Admin Utama' : adminRole === 'library' ? 'Admin Pustaka' : 'Mahasiswa'}
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {!isAdmin ? (
                <>
                  <NavItem page="dashboard" icon={LayoutDashboard} label="Beranda" />
                  <NavItem 
                    page="registration-hub" 
                    icon={FileText} 
                    label="Pendaftaran" 
                    activePageMatch={['proposal', 'skripsi', 'revision-proposal', 'revision-skripsi']} 
                  />
                  <NavItem 
                    page="schedule-status" 
                    icon={ListChecks} 
                    label="Jadwal & Status" 
                    hasNotificationDot={hasNotifications}
                  />
                </>
              ) : adminRole === 'main' ? (
                <>
                  <NavItem page="admin-validation" icon={CheckSquare} label="Validasi" />
                  <NavItem page="admin-scheduling" icon={Calendar} label="Jadwal & Sidang" />
                  <NavItem page="admin-reports" icon={ClipboardList} label="Laporan" />
                  <NavItem page="admin-settings" icon={Settings} label="Pengaturan" />
                </>
              ) : (
                // Library Admin
                <>
                  <NavItem page="library-admin" icon={Library} label="Validasi Revisi" />
                </>
              )}
            </nav>

            {/* Admin Toggle / Profile */}
            <div className="hidden md:flex items-center gap-2">
               {!isAdmin ? (
                 <>
                   <button 
                     onClick={() => handleLoginClick('main')}
                     className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                   >
                     <Lock size={14} /> Login Admin
                   </button>
                   <button 
                     onClick={() => handleLoginClick('library')}
                     className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
                   >
                     <BookOpen size={14} /> Login Pustaka
                   </button>
                 </>
               ) : (
                 <button 
                   onClick={handleLogout}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                     adminRole === 'main' 
                      ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100' 
                      : 'border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100'
                   }`}
                 >
                   <LogOut size={14} /> Logout
                 </button>
               )}
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600">
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {!isAdmin ? (
                <>
                  <NavItem page="dashboard" icon={LayoutDashboard} label="Beranda" />
                  <NavItem page="registration-hub" icon={FileText} label="Pendaftaran" />
                  <NavItem page="schedule-status" icon={ListChecks} label="Jadwal & Status" hasNotificationDot={hasNotifications} />
                </>
              ) : adminRole === 'main' ? (
                <>
                  <NavItem page="admin-validation" icon={CheckSquare} label="Validasi Berkas" />
                  <NavItem page="admin-scheduling" icon={Calendar} label="Penjadwalan" />
                  <NavItem page="admin-reports" icon={ClipboardList} label="Laporan" />
                  <NavItem page="admin-settings" icon={Settings} label="Pengaturan" />
                </>
              ) : (
                <>
                   <NavItem page="library-admin" icon={Library} label="Validasi Revisi" />
                </>
              )}
              
              <div className="pt-4 border-t border-slate-100 mt-2 space-y-2">
                 {!isAdmin ? (
                   <>
                     <button 
                       onClick={() => handleLoginClick('main')}
                       className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
                     >
                       <Lock size={16} /> Login Admin Utama
                     </button>
                     <button 
                       onClick={() => handleLoginClick('library')}
                       className="w-full flex items-center gap-2 px-4 py-3 text-sm text-orange-600 hover:bg-orange-50"
                     >
                       <BookOpen size={16} /> Login Admin Pustaka
                     </button>
                   </>
                 ) : (
                   <button 
                     onClick={handleLogout}
                     className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                   >
                     <LogOut size={16} /> Logout
                   </button>
                 )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 animate-fade-in">
        {children}
      </main>

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">
                        {loginTargetRole === 'main' ? 'Login Admin Utama' : 'Login Admin Pustaka'}
                    </h3>
                    <button onClick={() => setIsLoginModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={submitLogin} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                        <input 
                            type="password" 
                            autoFocus
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Masukkan Password..."
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    {loginError && (
                        <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-100">
                            {loginError}
                        </p>
                    )}
                    <button 
                        type="submit" 
                        className={`w-full py-2.5 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-95 ${
                            loginTargetRole === 'main' 
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' 
                                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
                        }`}
                    >
                        Masuk Sistem
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
