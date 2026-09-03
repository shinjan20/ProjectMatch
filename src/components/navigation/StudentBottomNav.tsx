import { Home, Compass, FileText, Briefcase, User } from 'lucide-react';
import { useLocation, Link, useSearchParams } from 'react-router-dom';

const StudentBottomNav = () => {
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();
    const currentTab = searchParams.get('tab');
    const hash = window.location.hash;

    const items = [
        { label: 'Home', icon: Home, route: '/dashboard/student', tab: null },
        { label: 'Explore', icon: Compass, route: '/projects', tab: null },
        { label: 'Applied', icon: FileText, route: '/dashboard/student?tab=applied', tab: 'applied' },
        { label: 'Projects', icon: Briefcase, route: '/dashboard/student?tab=ongoing', tab: 'ongoing' },
        { label: 'Profile', icon: User, route: '/settings', tab: null }
    ];

    return (
        <nav
            aria-label="Student mobile navigation"
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe z-50 transition-colors duration-200"
        >
            <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
                {items.map((item) => {
                    let isStrictlyActive = false;

                    if (item.tab) {
                        isStrictlyActive = pathname === '/dashboard/student' && (
                            currentTab === item.tab ||
                            (item.tab === 'applied' && hash === '#applications') ||
                            (item.tab === 'ongoing' && hash === '#projects')
                        );
                    } else if (item.route === '/dashboard/student') {
                        isStrictlyActive = pathname === '/dashboard/student' && (!currentTab || currentTab === 'applied') && (!hash || hash === '');
                    } else {
                        isStrictlyActive = pathname === item.route;
                    }

                    return (
                        <Link
                            key={item.label}
                            to={item.route}
                            aria-label={item.label}
                            aria-current={isStrictlyActive ? 'page' : undefined}
                            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 gap-1 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                                isStrictlyActive
                                    ? 'text-brand-600 dark:text-brand-400 font-bold'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
                            }`}
                        >
                            <item.icon className="w-5 h-5" strokeWidth={isStrictlyActive ? 2.5 : 2} />
                            <span className="text-[10px] tracking-tight">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default StudentBottomNav;
