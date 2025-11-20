
import React, { useState, useEffect } from 'react';
import { User, AppRecord } from './types';
import { authService } from './services/storage';
import { Layout } from './components/Layout';
import { Auth } from './views/Auth';
import { Dashboard } from './views/Dashboard';
import { RecordForm } from './views/RecordForm';
import { ReportList } from './views/ReportList';
import { AdminPanel } from './views/AdminPanel';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState('auth'); // 'auth', 'dashboard', 'form', 'reports', 'admin'
  const [subTab, setSubTab] = useState('travel');
  const [editingRecord, setEditingRecord] = useState<AppRecord | null>(null);
  
  // Track where we came from to return correctly after editing
  const [returnView, setReturnView] = useState<'dashboard' | 'admin'>('dashboard');

  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      setView('dashboard');
    } else {
      setView('auth');
    }
  }, []);

  const handleLogin = () => {
    const u = authService.getCurrentUser();
    setUser(u);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setView('auth');
  };

  const handleNavigate = (targetView: string, tab?: string) => {
    // If navigating away from form, clear editing state
    if (targetView !== 'form') {
        setEditingRecord(null);
    }
    setView(targetView);
    if (tab) setSubTab(tab);
    window.scrollTo(0,0);
  };

  // Edit triggered from Public Reports or Dashboard (if we had it there)
  const handleEditRecordPublic = (record: AppRecord) => {
      setEditingRecord(record);
      setupEdit(record);
      setReturnView('dashboard'); // Or reports, but standard flow is back to user area
      setView('form');
  };

  // Edit triggered from Admin Panel
  const handleEditRecordAdmin = (record: AppRecord) => {
      setEditingRecord(record);
      setupEdit(record);
      setReturnView('admin');
      setView('form');
  };

  const setupEdit = (record: AppRecord) => {
      const typeMap: Record<string, string> = {
          'TRAVEL': 'travel',
          'FUEL': 'fuel',
          'MAINTENANCE': 'maintenance'
      };
      setSubTab(typeMap[record.type] || 'travel');
  };

  const handleBack = () => {
    if (user) {
      handleNavigate('dashboard');
    } else {
      handleNavigate('auth');
    }
  };

  // --- RENDER LOGIC ---

  // 1. Admin Panel Route (Standalone, no user login required)
  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
         <div className="max-w-5xl mx-auto pt-6">
            <AdminPanel 
                onBack={handleBack} 
                currentUser={user} 
                onEditRecord={handleEditRecordAdmin}
            />
         </div>
      </div>
    );
  }

  // 2. Admin Editing Form Route (Standalone or Layout)
  // This allows Admin to edit records even if they are NOT logged in as a regular user.
  if (view === 'form' && returnView === 'admin') {
      // Create a mock user object for the Admin context if no real user is logged in
      const mockAdminUser: User = user || {
          id: 'ADMIN_MASTER',
          username: 'admin',
          fullName: 'ผู้ดูแลระบบ (Admin)',
          password: '',
          photo: null
      };

      return (
        <div className="min-h-screen bg-slate-50 pb-10">
            <div className="bg-red-700 text-white p-4 shadow-md sticky top-0 z-40">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <h1 className="font-bold text-lg">โหมดแก้ไขข้อมูลโดยผู้ดูแลระบบ (Admin Mode)</h1>
                    <button onClick={() => setView('admin')} className="text-sm bg-white/20 px-3 py-1 rounded hover:bg-white/30">
                        กลับหน้า Admin
                    </button>
                </div>
            </div>
            <div className="max-w-5xl mx-auto px-4 py-6">
                <RecordForm 
                    user={mockAdminUser} 
                    initialType={subTab} 
                    initialData={editingRecord}
                    isAdminMode={true}
                    onSuccess={() => {
                        setEditingRecord(null);
                        setView('admin');
                    }}
                    onCancel={() => {
                        setEditingRecord(null);
                        setView('admin');
                    }}
                />
            </div>
        </div>
      );
  }

  // 3. Authentication Screen
  if (!user && view === 'auth') {
    return (
      <Auth 
        onLogin={handleLogin} 
        onNavigateToAdmin={() => handleNavigate('admin')}
        onNavigateToReports={() => handleNavigate('reports')}
      />
    );
  }

  // 4. Public Reports View
  if (view === 'reports') {
    const content = (
       <div className={!user ? "max-w-5xl mx-auto pt-6 px-4" : ""}>
          <ReportList onBack={handleBack} />
       </div>
    );

    if (user) {
      return (
        <Layout user={user} onLogout={handleLogout} currentView={view} onNavigate={handleNavigate}>
          {content}
        </Layout>
      );
    } else {
      return <div className="min-h-screen bg-slate-50">{content}</div>;
    }
  }

  // 5. Authenticated User Routes (Dashboard & User Form)
  if (user) {
    return (
      <Layout user={user} onLogout={handleLogout} currentView={view} onNavigate={handleNavigate}>
        {view === 'dashboard' && (
          <Dashboard user={user} onNavigate={handleNavigate} />
        )}
        {view === 'form' && (
            <RecordForm 
                user={user} 
                initialType={subTab} 
                initialData={editingRecord}
                onSuccess={() => {
                    setEditingRecord(null);
                    handleNavigate('reports');
                }}
                onCancel={() => {
                    setEditingRecord(null);
                    handleNavigate('dashboard');
                }}
            />
        )}
      </Layout>
    );
  }

  return null; 
};

export default App;
