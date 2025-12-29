import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Mic, Upload, Video, BookOpen, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { icon: Mic, label: 'Live Audio', path: '/live-audio' },
    { icon: Upload, label: 'Upload Audio', path: '/upload-audio' },
    { icon: Video, label: 'Upload Video', path: '/upload-video' },
    { icon: BookOpen, label: 'History', path: '/history' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-950/95 border-r border-slate-700/50 shadow-2xl backdrop-blur-xl
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-screen md:h-full">
          <div className="p-8 border-b border-slate-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-white border border-slate-700">CC</div>
              <h1 className="text-2xl font-bold text-white">Captions</h1>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Caption Studio</p>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-lg transition-all font-medium ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent hover:border-slate-700'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-bold tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-5 border-t border-slate-700/50 space-y-4 bg-gradient-to-t from-slate-900/50 to-transparent">
            <div className="px-5 py-4 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 font-medium uppercase">Account</p>
              <p className="text-sm font-semibold text-white truncate mt-2">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
            </div>
            <Button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all font-medium rounded-lg py-2.5"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      
      <div className="flex-1 flex flex-col w-full h-screen md:h-auto">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-6 gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-slate-300 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-white border border-slate-700 md:hidden">CC</div>
            <div>
              <p className="text-sm text-white font-medium">Welcome Back</p>
              <p className="text-xs text-slate-400">{user?.name || 'Guest'}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full">
          <Outlet />
        </main>
      </div>

    
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;
