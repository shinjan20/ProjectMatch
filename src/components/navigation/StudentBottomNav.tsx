import { Home, Compass, FileText, Briefcase, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const StudentBottomNav = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const items = [
        { label: 'Home', icon: Home, route: '/dashboard/student' },
        { label: 'Explore', icon: Compass, route: '/projects' },
        // For Applications and Projects, they currently live on the dashboard via state tabs.
        // We will route them to dashboard with a hash to trigger the specific tab.
        { label: 'Applications', icon: FileText, route: '/dashboard/student#applications' },
        { label: 'Projects', icon: Briefcase, route: '/dashboard/student#projects' },
        { label: 'Profile', icon: User, route: '/settings' }
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
            <div className="flex items-center justify-around h-16 px-2">
                {items.map((item) => {
                    // For Home vs Applications vs Projects which are all on /dashboard/student
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

export default StudentBottomNav;
