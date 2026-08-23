import { useState } from 'react';
import { Search, Filter, Clock, Tag, ArrowRight, Banknote, Calendar, Users, Home } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProjectFiltersModal from '../components/student/ProjectFiltersModal';
import ApplicationModal from '../components/student/ApplicationModal';
import ProjectDetailsModal from '../components/student/ProjectDetailsModal';
import AlertModal from '../components/AlertModal';
import { useEffect } from 'react';
import { useInterviewStatus } from '../hooks/useInterviewStatus';

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

const Projects = () => {
    const { isAuthenticated, userRole, hasCompletedProfile, userId } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialBookmarkFilter = searchParams.get('bookmarks') === 'true';

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Advanced Filters State
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        duration: [] as string[],
        stipend: '',
        skills: [] as string[],
        workType: [] as string[],
        showBookmarkedOnly: initialBookmarkFilter
    });

    // Application Modal State
    const [applyingProjectId, setApplyingProjectId] = useState<string | null>(null);
    const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'info' | 'error';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Bookmarks State
    const [bookmarkedProjectIds, setBookmarkedProjectIds] = useState<string[]>(() => {
        const saved = localStorage.getItem(`pyroBookmarks_${userId || 'guest'}`);
        return saved ? JSON.parse(saved) : [];
    });

    // Applications State
    const [appliedProjectIds, setAppliedProjectIds] = useState<string[]>([]);

    // Live Projects State
    const [liveProjects, setLiveProjects] = useState<any[]>([]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [selectedCategory, searchTerm, activeFilters]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (userRole === 'student' && userId) {
                // Fetch applied projects
                const { data: appsData } = await supabase
                    .from('applications')
                    .select('project_id')
                    .eq('student_id', userId);
                if (appsData) {
                    setAppliedProjectIds(appsData.map(a => a.project_id));
                }

                // Fetch persistent bookmarks from profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('bookmarked_projects')
                    .eq('id', userId)
                    .maybeSingle();
                
                if (profileData && profileData.bookmarked_projects) {
                    setBookmarkedProjectIds(profileData.bookmarked_projects);
                }
            }
        };
        fetchUserData();
    }, [userId, userRole]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // Fetch active projects that are open
                const { data: projectsData, error } = await supabase
                    .from('projects')
                    .select(`
                        id,
                        role,
                        domain,
                        objective,
                        expectations,
                        positions,
                        tenure,
                        remuneration,
                        status,
                        created_at,
                        recruiter:profiles!projects_recruiter_id_fkey (
                            company_name
                        )
                    `)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const { data: appsData } = await supabase
                    .from('applications')
                    .select('project_id, status')
                    .in('status', ['accepted', 'completed']);

                const hiredCounts: Record<string, number> = {};
                appsData?.forEach(app => {
                    hiredCounts[app.project_id] = (hiredCounts[app.project_id] || 0) + 1;
                });

                if (projectsData) {
                    const formatted = projectsData.map((p: any) => ({
                        id: p.id,
                        title: p.role,
                        company: p.recruiter?.company_name || 'Company',
                        category: p.domain,
                        type: 'Remote', // Hardcoded for now
                        duration: p.tenure + ' months',
                        remuneration: p.remuneration,
                        totalPositions: p.positions || 1,
                        hiredPositions: hiredCounts[p.id] || 0,
                        postedAt: p.created_at,
                        tags: [p.domain],
                    }));
                    setLiveProjects(formatted);
                }
            } catch (err) {
                console.error("Error fetching projects:", err);
            }
        };

        fetchProjects();
    }, []);

    const { interviewStatus } = useInterviewStatus();

    useEffect(() => {
        // Fallback for non-logged in users or fast local cache
        localStorage.setItem(`pyroBookmarks_${userId || 'guest'}`, JSON.stringify(bookmarkedProjectIds));
    }, [bookmarkedProjectIds, userId]);

    const toggleBookmark = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (!userId) {
            // Only unauthenticated handle locally
            setBookmarkedProjectIds(prev =>
                prev.includes(projectId) ? prev.filter(b => b !== projectId) : [...prev, projectId]
            );
            return;
        }

        const isCurrentlyBookmarked = bookmarkedProjectIds.includes(projectId);
        const newBookmarks = isCurrentlyBookmarked
            ? bookmarkedProjectIds.filter(b => b !== projectId)
            : [...bookmarkedProjectIds, projectId];

        // Optimistic UI update
        setBookmarkedProjectIds(newBookmarks);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ bookmarked_projects: newBookmarks })
                .eq('id', userId);
            
            if (error) throw error;
        } catch (error) {
            console.error('Error updating bookmarks:', error);
            // Revert optimistic update on failure
            setBookmarkedProjectIds(bookmarkedProjectIds);
        }
    };

    // Watch for URL search parameter changes (bookmarks toggle)
    useEffect(() => {
        const isBookmarksFilter = searchParams.get('bookmarks') === 'true';
        setActiveFilters(prev => ({
            ...prev,
            showBookmarkedOnly: isBookmarksFilter
        }));
    }, [searchParams]);

    const filteredProjects = liveProjects.filter(project => {
        // Auto-archive rule: if older than 2 months (approx 60 days) and 0 hired positions, do not show in live projects
        const isOlderThan2Months = (Date.now() - new Date(project.postedAt).getTime()) > 60 * 24 * 60 * 60 * 1000;
        if (isOlderThan2Months && project.hiredPositions === 0) {
            return false;
        }

        // Hide applied projects for students
        if (userRole === 'student' && appliedProjectIds.includes(project.id)) {
            return false;
        }

        const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.company.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;

        // Apply advanced filters
        let matchesAdvanced = true;
        if (activeFilters.duration.length > 0) {
            matchesAdvanced = matchesAdvanced && activeFilters.duration.includes(project.duration);
        }
        if (activeFilters.workType.length > 0) {
            matchesAdvanced = matchesAdvanced && activeFilters.workType.includes(project.type);
        }
        if (activeFilters.skills.length > 0) {
            // Check if project has all the selected skills
            matchesAdvanced = matchesAdvanced && activeFilters.skills.every(skill => project.tags.includes(skill));
        }
        if (activeFilters.stipend !== '') {
            matchesAdvanced = matchesAdvanced && Number(project.remuneration) >= Number(activeFilters.stipend);
        }

        if (activeFilters.showBookmarkedOnly) {
            matchesAdvanced = matchesAdvanced && bookmarkedProjectIds.includes(project.id);
        }

        return matchesSearch && matchesCategory && matchesAdvanced;
    });

    return (
        <div className="relative min-h-screen pt-32 pb-20 bg-slate-50 dark:bg-[#030712] transition-colors duration-500 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[0%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/20 dark:bg-brand-500/5 blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 dark:bg-purple-500/5 blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen"></div>
                {/* Noise overlay */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Page Header */}
                <div className="mb-12 text-center sm:text-left">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black tracking-tight text-slate-900 dark:text-white mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-500">Live Project</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        Browse top-tier remote and on-site projects from industry leaders. Build your resume with real-world experience.
                    </p>
                </div>

                {/* Search and Filters - Glass Command Center */}
                <div className="glass rounded-[2rem] p-2 md:p-3 mb-10 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xl shadow-brand-500/5 border border-white/40 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <div className="relative w-full md:w-96 flex-shrink-0 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search roles, companies..."
                            className="block w-full pl-11 pr-4 py-3.5 border border-transparent rounded-[1.5rem] bg-slate-100/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30 focus:bg-white dark:focus:bg-[#030712] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar flex items-center px-2">
                        <div className="flex gap-2">
                            {CATEGORIES.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory === category
                                        ? 'bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-lg shadow-brand-500/20 border border-transparent'
                                        : 'bg-transparent text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                            <button
                                onClick={() => setIsFiltersModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-medium transition-all shadow-xl shadow-slate-900/10 btn-interactive ml-2 relative"
                            >
                                <Filter className="w-4 h-4" /> Filters
                                {(activeFilters.duration.length > 0 || activeFilters.stipend !== '' || activeFilters.skills.length > 0 || activeFilters.workType.length > 0 || activeFilters.showBookmarkedOnly) && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 border-2 border-slate-900 dark:border-white rounded-full"></span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Projects Grid Container with hover effect */}
                <div className="group/grid relative">
                    {/* Underlying glow that activates when hovering any grid item */}
                    <div className="absolute inset-0 bg-brand-500/5 dark:bg-brand-500/10 blur-[100px] rounded-full opacity-0 group-hover/grid:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        {filteredProjects.length > 0 ? (
                            filteredProjects.map((project) => (
                                <div
                                    key={project.id}
                                    onClick={() => setViewingProjectId(project.id)}
                                    className="glass-card p-4 sm:p-6 flex flex-col group/card cursor-pointer hover:border-brand-500/50"
                                >
                                    <div className="mb-5 flex items-start justify-between">
                                        <div className="relative">
                                            {/* Neon subtle backdrop for category */}
                                            <div className="absolute inset-0 bg-brand-500/20 blur-md rounded-full -z-10 group-hover/card:bg-brand-500/40 transition-colors"></div>
                                            <span className="inline-flex px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-700 dark:text-brand-300 text-xs font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                                                {project.category}
                                            </span>
                                        </div>
                                        {userRole !== 'recruiter' && (
                                            <button
                                                onClick={(e) => toggleBookmark(e, project.id)}
                                                className={`p-2 rounded-full backdrop-blur-sm border transition-all duration-300 ${bookmarkedProjectIds.includes(project.id)
                                                    ? 'bg-brand-500/20 border-brand-500/50 text-brand-500 dark:text-brand-400'
                                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 hover:text-brand-500'
                                                    }`}
                                                aria-label={bookmarkedProjectIds.includes(project.id) ? "Remove bookmark" : "Add bookmark"}
                                            >
                                                <BookmarkIcon className="w-4 h-4" filled={bookmarkedProjectIds.includes(project.id)} />
                                            </button>
                                        )}
                                    </div>

                                    <h3 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-3 group-hover/card:text-transparent group-hover/card:bg-clip-text group-hover/card:bg-gradient-to-r group-hover/card:from-brand-500 group-hover/card:to-purple-500 transition-all duration-300 break-words hyphens-auto">
                                        {project.title}
                                    </h3>

                                    <div className="flex items-center justify-between gap-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center font-bold text-sm text-slate-500 border border-slate-200 dark:border-slate-800 shadow-inner">
                                                {project.company.charAt(0)}
                                            </div>
                                            <span className="text-slate-600 dark:text-slate-400 font-semibold text-sm">
                                                {project.company}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-500 font-medium">
                                            <Calendar className="w-3.5 h-3.5 mr-1" />
                                            {timeAgo(project.postedAt)}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 mb-6 flex-grow p-4 rounded-2xl bg-slate-50/50 dark:bg-[#030712]/50 border border-slate-100 dark:border-slate-800/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                <Clock className="w-4 h-4 mr-3 text-brand-500" /> {project.duration}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg whitespace-nowrap border border-green-200 dark:border-green-500/20 shadow-sm transition-colors relative overflow-hidden group-hover:border-green-300 dark:group-hover:border-green-500/40">
                                                <div className="absolute inset-0 bg-green-400/10 dark:bg-green-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                                <Home className="w-4 h-4 relative z-10" />
                                                <span className="font-medium relative z-10">WFH ({project.type})</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                <Banknote className="w-4 h-4 mr-3 text-emerald-500" /> {project.remuneration === '0' || Number(project.remuneration) === 0 ? 'Unpaid' : `₹${project.remuneration}/month`}
                                            </div>
                                            <div className="flex items-center text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-1 rounded-md">
                                                <Users className="w-3.5 h-3.5 mr-1.5" />
                                                {project.totalPositions - project.hiredPositions} position{project.totalPositions - project.hiredPositions !== 1 ? 's' : ''} left
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {project.tags.map((tag: string) => (
                                            <span key={tag} className="flex items-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <Tag className="w-3 h-3 mr-1.5 opacity-50" /> {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {userRole !== 'recruiter' && (
                                        <div className="mt-auto pt-2">
                                            {/* Subtle interactive wrapper for button */}
                                            <div className="relative p-[1px] rounded-xl overflow-hidden group/btn">
                                                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                                                {!isAuthenticated ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate('/login?returnTo=/projects'); }}
                                                        className="relative w-full bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 py-3 rounded-[11px] font-semibold hover:bg-slate-800 dark:hover:bg-white transition-colors flex items-center justify-center gap-2 z-10 opacity-70 group-hover/card:opacity-100 backdrop-blur-md btn-interactive"
                                                    >
                                                        Login to Apply <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!hasCompletedProfile) {
                                                                navigate('/dashboard/student');
                                                                return;
                                                            }
                                                            setApplyingProjectId(project.id);
                                                        }}
                                                        disabled={interviewStatus === 'closed'}
                                                        title={interviewStatus === 'closed' ? "Your profile is closed to projects." : ""}
                                                        className={`relative w-full text-white py-3 rounded-[11px] font-semibold transition-colors flex items-center justify-center gap-2 z-10 backdrop-blur-md ${interviewStatus === 'closed'
                                                            ? 'bg-brand-600/50 cursor-not-allowed opacity-50 grayscale blur-[1px]'
                                                            : 'bg-brand-600/90 hover:bg-brand-500 opacity-70 group-hover/card:opacity-100 btn-interactive'
                                                            }`}
                                                    >
                                                        Apply Now <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-24 glass-card text-center flex flex-col items-center justify-center min-h-[400px]">
                                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6 relative">
                                    <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full"></div>
                                    <Search className="w-10 h-10 text-slate-400 relative z-10" />
                                </div>
                                <h3 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-3">No matching projects</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">We couldn't find anything matching your current filters. Try broadening your search terms.</p>
                                <button
                                    onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                                    className="mt-8 text-white bg-brand-600 hover:bg-brand-500 font-medium px-6 py-3 rounded-full transition-all shadow-lg shadow-brand-500/20 btn-interactive"
                                >
                                    Reset all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ProjectFiltersModal
                isOpen={isFiltersModalOpen}
                onClose={() => setIsFiltersModalOpen(false)}
                filters={activeFilters}
                onFiltersChange={setActiveFilters}
            />

            {viewingProjectId !== null && (
                <ProjectDetailsModal
                    isOpen={viewingProjectId !== null}
                    onClose={() => setViewingProjectId(null)}
                    projectId={viewingProjectId!}
                    project={liveProjects.find(p => p.id === viewingProjectId)}
                    onApplyClicked={() => {
                        setViewingProjectId(null);
                        setApplyingProjectId(viewingProjectId);
                    }}
                />
            )}

            {applyingProjectId !== null && (
                <ApplicationModal
                    isOpen={applyingProjectId !== null}
                    onClose={() => setApplyingProjectId(null)}
                    projectId={applyingProjectId!}
                    project={liveProjects.find(p => p.id === applyingProjectId)}
                    onSubmitSuccess={() => {
                        if (applyingProjectId) {
                            setAppliedProjectIds(prev => [...prev, applyingProjectId as string]);
                        }
                        setApplyingProjectId(null);
                        setAlertConfig({
                            isOpen: true,
                            title: 'Application Sent!',
                            message: 'Your profile and application details have been forwarded to the recruiter successfully.',
                            type: 'success'
                        });
                    }}
                />
            )}

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </div>
    );
};

// Simple bookmark outline icon
function BookmarkIcon({ filled = false, ...props }: React.SVGProps<SVGSVGElement> & { filled?: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
    );
}

export default Projects;
