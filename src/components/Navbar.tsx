import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Menu, X, LogOut, User as UserIcon, Settings as SettingsIcon, MoreHorizontal, Check, XCircle, CheckCircle2, Bell, SquareTerminal, Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useInterviewStatus } from '../hooks/useInterviewStatus';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import AssistantModal from './ai/AssistantModal';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useAIContext } from '../contexts/AIContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showNotificationCenter, setShowNotificationCenter] = useState(false);
    
    const { isAssistantOpen, openAssistant, closeAssistant } = useAIContext();
    const { theme, setTheme } = useTheme();
    const { unreadCount } = useNotifications();
    
    useKeyboardShortcut('k', () => {
        openAssistant();
    }, { ctrl: true, preventDefault: true });
    const [_, setTick] = useState(0);

    useEffect(() => {
        const handleUpdate = () => {
            setTick(prev => prev + 1);
        };
        window.addEventListener('pm_notifications_updated', handleUpdate);
        return () => window.removeEventListener('pm_notifications_updated', handleUpdate);
    }, []);

    const { userRole, userName, userPhoto, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const { interviewStatus, updateStatus: setInterviewStatus } = useInterviewStatus();

    const isActive = (path: string) => location.pathname === path;

    const handleHowItWorksClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpen(false);
        if (location.pathname === '/') {
            const element = document.getElementById('how-it-works');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate('/');
            setTimeout(() => {
                const element = document.getElementById('how-it-works');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    };

    const handleLogout = async () => {
        const loadingToast = toast.loading('Logging out...');
        try {
            await logout();
            toast.success('Logged out successfully', { id: loadingToast });
        } catch (error) {
            console.error("Logout failed in Navbar:", error);
            toast.error('Logout failed', { id: loadingToast });
        } finally {
            setShowProfileMenu(false);
            setIsOpen(false);
            setTimeout(() => {
                window.location.href = '/'; // Hard refresh to ensure all states are cleared 
            }, 800);
        }
    };

    return (
        <nav className="sticky top-0 w-full z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link
                        to={isAuthenticated ? (userRole === 'recruiter' ? '/dashboard/recruiter' : '/projects') : '/'}
                        className="flex-shrink-0 flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                        aria-label="ProjectMatch Home"
                    >
                        <div className="flex items-center justify-center w-8 h-8">
                            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                {/* Left Chevron (Dark Navy / White in dark mode) */}
                                <path d="M12 16 L4 8 H12 L20 16 L12 24 H4 L12 16 Z" fill="currentColor" className="text-slate-900 dark:text-white" />
                                {/* Right Chevron (Brand Blue) */}
                                <path d="M22 16 L14 8 H22 L30 16 L22 24 H14 L22 16 Z" fill="#4F46E5" />
                            </svg>
                        </div>
                        <span className="font-heading tracking-tight text-slate-900 dark:text-white text-xl">
                            <span className="font-medium">Project</span><span className="font-bold">Match</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        {!isAuthenticated && (
                            <Link to="/" className={`${isActive('/') ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium'} transition-colors`}>Home</Link>
                        )}
                        {!isAuthenticated && (
                            <Link to="/projects" className={`${isActive('/projects') ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium'} transition-colors`}>Find WFH Projects</Link>
                        )}
                        {!isAuthenticated && (
                            <button onClick={handleHowItWorksClick} className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors">How it Works</button>
                        )}
                        {isAuthenticated && userRole === 'student' && (
                            <>
                                <Link to="/dashboard/student" className={`${isActive('/dashboard/student') ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium'} transition-colors`}>Dashboard</Link>
                                <Link to="/projects" className={`${isActive('/projects') ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium'} transition-colors`}>Find Projects</Link>
                            </>
                        )}
                        {isAuthenticated && userRole === 'recruiter' && (
                            <Link to="/dashboard/recruiter" className={`${isActive('/dashboard/recruiter') ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium'} transition-colors`}>Dashboard</Link>
                        )}
                        <div className="flex items-center gap-4">
                            {isAuthenticated && userRole === 'student' && (
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowStatusMenu(!showStatusMenu);
                                            setShowProfileMenu(false);
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className={`p-1 rounded-full ${interviewStatus === 'ready' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            interviewStatus === 'open' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {interviewStatus === 'ready' ? <MoreHorizontal className="w-4 h-4" /> :
                                                interviewStatus === 'open' ? <Check className="w-4 h-4" /> :
                                                    <XCircle className="w-4 h-4" />}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            {interviewStatus === 'ready' ? 'Ready for projects' :
                                                interviewStatus === 'open' ? 'Open to projects' : 'Closed to projects'}
                                        </span>
                                    </button>

                                    {showStatusMenu && (
                                        <div className="absolute top-full right-0 mt-2 w-max max-w-[90vw] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                                            <button
                                                onClick={() => { setInterviewStatus('ready'); setShowStatusMenu(false); }}
                                                className={`w-full text-left flex gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${interviewStatus === 'ready' ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                                            >
                                                <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0 h-fit">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Ready for projects</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">You're actively looking for new live projects to build. Your profile will be visible to recruiters.</p>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => { setInterviewStatus('open'); setShowStatusMenu(false); }}
                                                className={`w-full text-left flex gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${interviewStatus === 'open' ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                                            >
                                                <div className="p-1.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shrink-0 h-fit">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Open to projects</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">You're not actively looking but open to hear about exciting new projects.</p>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => { setInterviewStatus('closed'); setShowStatusMenu(false); }}
                                                className={`w-full text-left flex gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${interviewStatus === 'closed' ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                                            >
                                                <div className="p-1.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shrink-0 h-fit">
                                                    <XCircle className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Closed to projects</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">You're not looking and don't want to hear about new projects. Your profile is hidden.</p>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center gap-1 md:gap-3 mr-2">
                                {/* AI Assistant CMD+K Trigger */}
                                <button
                                    onClick={() => openAssistant()}
                                    className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 group"
                                >
                                    <SquareTerminal className="w-4 h-4 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold mr-1">Ask Atlas</span>
                                    <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400">
                                        <span className="text-[11px]">⌘</span>K
                                    </kbd>
                                </button>

                                {/* Mobile AI Trigger */}
                                <button
                                    onClick={() => openAssistant()}
                                    className="md:hidden relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                                    aria-label="Ask Atlas"
                                >
                                    <SquareTerminal className="w-5 h-5" />
                                </button>
                            </div>

                            {isAuthenticated && (
                                <div className="flex items-center gap-1 md:gap-3 mr-2">

                                    {/* Theme Toggle */}
                                    <button
                                        onClick={() => {
                                            if (theme === 'light') setTheme('dark');
                                            else if (theme === 'dark') setTheme('auto');
                                            else setTheme('light');
                                        }}
                                        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850/50 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mr-1"
                                        aria-label="Toggle theme"
                                        title={`Theme: ${theme}`}
                                    >
                                        {theme === 'light' && <Sun className="w-5 h-5" />}
                                        {theme === 'dark' && <Moon className="w-5 h-5" />}
                                        {theme === 'auto' && <Monitor className="w-5 h-5" />}
                                    </button>

                                    <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowNotificationCenter(!showNotificationCenter);
                                            setShowProfileMenu(false);
                                            setShowStatusMenu(false);
                                        }}
                                        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850/50 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                        aria-label="Notification center"
                                    >
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-4 h-4 bg-brand-650 text-[9px] font-black text-white flex items-center justify-center rounded-full border border-white dark:border-slate-900">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    <NotificationCenter
                                        isOpen={showNotificationCenter}
                                        onClose={() => setShowNotificationCenter(false)}
                                    />
                                    </div>
                                </div>
                            )}
                            {isAuthenticated ? (
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(!showProfileMenu);
                                            setShowStatusMenu(false);
                                        }}
                                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 overflow-hidden border border-brand-200 dark:border-brand-800">
                                            {userPhoto ? (
                                                <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-4 h-4" />
                                            )}
                                        </div>
                                        <span className="max-w-[120px] truncate">{userName}</span>
                                    </button>

                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{userName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{userRole}</p>
                                            </div>
                                            <div className="p-2 flex flex-col gap-1">
                                                <Link
                                                    to="/settings"
                                                    onClick={() => setShowProfileMenu(false)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left font-medium"
                                                >
                                                    <SettingsIcon className="w-4 h-4" /> Account Settings
                                                </Link>
                                                {userRole === 'student' && (
                                                    <Link
                                                        to="/completed-projects"
                                                        onClick={() => setShowProfileMenu(false)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left font-medium"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> Completed Projects
                                                    </Link>
                                                )}
                                                <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors text-left"
                                                >
                                                    <LogOut className="w-4 h-4" /> Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 lg:gap-4">
                                    {/* Theme Toggle for Unauthenticated */}
                                    <button
                                        onClick={() => {
                                            if (theme === 'light') setTheme('dark');
                                            else if (theme === 'dark') setTheme('auto');
                                            else setTheme('light');
                                        }}
                                        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850/50 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                        aria-label="Toggle theme"
                                        title={`Theme: ${theme}`}
                                    >
                                        {theme === 'light' && <Sun className="w-5 h-5" />}
                                        {theme === 'dark' && <Moon className="w-5 h-5" />}
                                        {theme === 'auto' && <Monitor className="w-5 h-5" />}
                                    </button>
                                    <Link to="/login" className="text-white bg-brand-600 hover:bg-brand-700 font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-brand-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all btn-interactive">
                                        Sign In
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {!isAuthenticated && (
                        <div className="md:hidden flex items-center">
                            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 focus:outline-none">
                                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile menu - Only for unauthenticated users now, as authenticated use BottomNav */}
            {isOpen && !isAuthenticated && (
                <div className="md:hidden glass mt-2 rounded-2xl border border-white/20 dark:border-slate-800/60 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-2 pt-2 pb-6 space-y-1 sm:px-3">
                        {!isAuthenticated && (
                            <Link to="/" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-lg text-base ${isActive('/') ? 'font-bold text-brand-600 bg-slate-50 dark:bg-slate-800/50' : 'font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Home</Link>
                        )}
                        {!isAuthenticated && (
                            <Link to="/projects" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-lg text-base ${isActive('/projects') ? 'font-bold text-brand-600 bg-slate-50 dark:bg-slate-800/50' : 'font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Find Projects</Link>
                        )}
                        {!isAuthenticated && (
                            <button onClick={handleHowItWorksClick} className="block w-full text-left px-3 py-3 rounded-lg text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">How it Works</button>
                        )}
                        {isAuthenticated && userRole === 'student' && (
                            <>
                                <Link to="/dashboard/student" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-lg text-base ${isActive('/dashboard/student') ? 'font-bold text-brand-600 bg-slate-50 dark:bg-slate-800/50' : 'font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Dashboard</Link>
                                <Link to="/projects" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-lg text-base ${isActive('/projects') ? 'font-bold text-brand-600 bg-slate-50 dark:bg-slate-800/50' : 'font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Find Projects</Link>
                            </>
                        )}
                        {isAuthenticated && userRole === 'recruiter' && (
                            <Link to="/dashboard/recruiter" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-lg text-base ${isActive('/dashboard/recruiter') ? 'font-bold text-brand-600 bg-slate-50 dark:bg-slate-800/50' : 'font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Dashboard</Link>
                        )}

                        <div className="pt-4 flex flex-col gap-3 px-3">
                            {isAuthenticated ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 overflow-hidden border border-brand-200 dark:border-brand-800">
                                            {userPhoto ? (
                                                <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{userName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{userRole}</p>
                                        </div>
                                    </div>

                                    {userRole === 'student' && (
                                        <div className="px-1 py-2 mt-2 space-y-2 border-t border-slate-200 dark:border-slate-800">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 mb-2">Interview Status</p>

                                            <button
                                                onClick={() => { setInterviewStatus('ready'); setIsOpen(false); }}
                                                className={`w-full text-left flex items-center gap-3 p-2 rounded-xl transition-colors ${interviewStatus === 'ready' ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}
                                            >
                                                <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-white text-sm">Ready to interview</span>
                                            </button>

                                            <button
                                                onClick={() => { setInterviewStatus('open'); setIsOpen(false); }}
                                                className={`w-full text-left flex items-center gap-3 p-2 rounded-xl transition-colors ${interviewStatus === 'open' ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}
                                            >
                                                <div className="p-1.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-white text-sm">Open to offers</span>
                                            </button>

                                            <button
                                                onClick={() => { setInterviewStatus('closed'); setIsOpen(false); }}
                                                className={`w-full text-left flex items-center gap-3 p-2 rounded-xl transition-colors ${interviewStatus === 'closed' ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}
                                            >
                                                <div className="p-1.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                    <XCircle className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-white text-sm">Closed to offers</span>
                                            </button>
                                        </div>
                                    )}

                                    <Link
                                        to="/settings"
                                        onClick={() => setIsOpen(false)}
                                        className="block w-full text-center py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex justify-center items-center gap-2"
                                    >
                                        <SettingsIcon className="w-5 h-5" /> Account Settings
                                    </Link>

                                    {userRole === 'student' && (
                                        <Link
                                            to="/completed-projects"
                                            onClick={() => setIsOpen(false)}
                                            className="block w-full text-center py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex justify-center items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-5 h-5" /> Completed Projects
                                        </Link>
                                    )}

                                    <button onClick={() => { handleLogout(); setIsOpen(false); }} className="block w-full text-center py-3 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex justify-center items-center gap-2">
                                        <LogOut className="w-5 h-5" /> Sign Out
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full text-center py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Assistant Modal */}
            <AssistantModal 
                isOpen={isAssistantOpen} 
                onClose={closeAssistant} 
            />
        </nav>
    );
};

export default Navbar;
