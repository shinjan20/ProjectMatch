import { Home, Briefcase, Users, MessageSquare, MoreHorizontal } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const RecruiterBottomNav = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const items = [
        { label: 'Home', icon: Home, route: '/dashboard/recruiter' },
        { label: 'Projects', icon: Briefcase, route: '/dashboard/recruiter#projects' },
        { label: 'Candidates', icon: Users, route: '/dashboard/recruiter#candidates' },
        { label: 'Inbox', icon: MessageSquare, route: '/dashboard/recruiter#inbox' },
        { label: 'More', icon: MoreHorizontal, route: '/settings' } // Settings or menu
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
            <div className="flex items-center justify-around h-16 px-2">
                {items.map((item) => {
                    const isStrictlyActive = item.route.includes('#') 
                        ? window.location.hash === '#' + item.route.split('#')[1]
                        : pathname === item.route && (!window.location.hash || window.location.hash === '');

                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.route)}
                            className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                                isStrictlyActive
                                    ? 'text-brand-600 dark:text-brand-400'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${isStrictlyActive ? 'fill-brand-50 dark:fill-brand-900/30' : ''}`} />
                            <span className="text-[10px] font-semibold">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default RecruiterBottomNav;
