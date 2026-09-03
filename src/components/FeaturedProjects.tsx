
import { ArrowRight, Clock, Tag, Banknote, Calendar, Users, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MOCK_PROJECTS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

const timeAgo = (dateInput?: string) => {
    if (!dateInput) return 'Recently';
    const seconds = Math.floor((new Date().getTime() - new Date(dateInput).getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';

    return 'Just now';
};

const FeaturedProjects = () => {
    const { userRole } = useAuth();
    const navigate = useNavigate();

    const featuredList = MOCK_PROJECTS.filter(project => {
        const isOlderThan2Months = (Date.now() - new Date(project.postedAt).getTime()) > 60 * 24 * 60 * 60 * 1000;
        return !(isOlderThan2Months && project.hiredPositions === 0);
    }).slice(0, 3);

    return (
        <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 md:mb-12 gap-6">
                    <div className="mb-8 md:mb-12 text-center md:text-left">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                            Featured Live Projects
                        </h2>
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto md:mx-0">
                            Gain hands-on experience by tackling real-world problems from top companies.
                        </p>
                    </div>
                    <Link to="/projects" className="hidden md:flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium hover:text-brand-700 dark:hover:text-brand-300 transition-colors btn-interactive py-2 px-4 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-500/10">
                        View all projects <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {featuredList.map((project) => (
                        <div key={project.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col group cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all">
                            <div className="mb-4 flex items-start justify-between">
                                <span className="inline-flex px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-wide uppercase">
                                    {project.category}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500">
                                    <BookmarkIcon className="w-5 h-5 group-hover:text-brand-500 transition-colors" />
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors break-words hyphens-auto">
                                {project.title}
                            </h3>

                            <div className="flex items-center justify-between mb-6">
                                <div className="text-slate-600 dark:text-slate-400 font-medium tracking-tight">
                                    {project.company}
                                </div>
                                <div className="flex items-center text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-full">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {timeAgo(project.postedAt)}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mb-6 flex-grow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                        <Clock className="w-4 h-4 mr-2" /> {project.duration}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-sm text-green-700 dark:text-green-400 font-medium">
                                        <Home className="w-4 h-4 mr-2" /> WFH ({project.type})
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <Banknote className="w-4 h-4 mr-2 text-brand-500" /> {project.remuneration === '0' || Number(project.remuneration) === 0 ? 'Unpaid' : `₹${project.remuneration}/month`}
                                    </div>
                                    <div className="flex items-center text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-1 rounded-md mt-1">
                                        <Users className="w-3.5 h-3.5 mr-1.5" />
                                        {project.totalPositions - project.hiredPositions} position{project.totalPositions - project.hiredPositions !== 1 ? 's' : ''} left
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {project.tags.map((tag) => (
                                    <span key={tag} className="flex items-center text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md">
                                        <Tag className="w-3 h-3 mr-1 opacity-50" /> {tag}
                                    </span>
                                ))}
                            </div>

                            {userRole !== 'recruiter' && (
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/projects');
                                        }}
                                        className="w-full text-center text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 py-3 rounded-xl btn-interactive hover:shadow-sm"
                                    >
                                        Check Details <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-10 md:hidden flex justify-center">
                    <Link to="/projects" className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium hover:text-brand-700 dark:hover:text-brand-300 transition-colors btn-interactive py-3 px-6 rounded-xl bg-brand-50 dark:bg-brand-500/10">
                        View all projects <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

// Simple bookmark outline icon
function BookmarkIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
    );
}

export default FeaturedProjects;
