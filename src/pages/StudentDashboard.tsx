import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Briefcase, CheckCircle2, Archive, Clock, Home, Banknote, Calendar, Tag, X, CalendarCheck, MessageSquare, Download, XCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentMessagingHub from '../components/student/StudentMessagingHub';
import toast from 'react-hot-toast';
import PageSkeleton from '../components/common/PageSkeleton';

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

/**
 * Translates internal recruiter pipeline stage identifiers into
 * student-facing status labels. Prevents internal process terminology
 * from leaking into the student workspace.
 */
const studentFriendlyStatus = (rawStatus: string): { label: string; color: string } => {
    switch (rawStatus) {
        case 'pending':      return { label: 'Applied — Under Initial Review', color: 'text-amber-600 dark:text-amber-400' };
        case 'reviewing':    return { label: 'Application Under Review', color: 'text-blue-600 dark:text-blue-400' };
        case 'shortlisted':  return { label: 'Resume Shortlisted ✓', color: 'text-indigo-600 dark:text-indigo-400' };
        case 'interview':    return { label: 'Interview Stage', color: 'text-purple-600 dark:text-purple-400' };
        case 'final_review': return { label: 'Under Final Consideration', color: 'text-brand-600 dark:text-brand-400' };
        case 'accepted':
        case 'working':      return { label: 'Offer Accepted 🎉', color: 'text-green-600 dark:text-green-400' };
        case 'completed':    return { label: 'Project Completed', color: 'text-green-700 dark:text-green-300' };
        case 'rejected':
        case 'declined':     return { label: 'Application Concluded', color: 'text-slate-500 dark:text-slate-400' };
        default:             return { label: 'Applied', color: 'text-slate-500 dark:text-slate-400' };
    }
};

export default function StudentDashboard() {
    const { userName, userRole, userId } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'applied' | 'interviews' | 'ongoing' | 'messages' | 'archived' | 'analytics'>('applied');
    const [viewingApplicationId, setViewingApplicationId] = useState<string | null>(null);
    const [downloadingLetter, setDownloadingLetter] = useState<{ projectId: string, type: 'Offer Letter' | 'Completion Letter' } | null>(null);

    // Supabase connected state lists
    const [appliedProjects, setAppliedProjects] = useState<any[]>([]);
    const [interviewProjects, setInterviewProjects] = useState<any[]>([]);
    const [ongoingProjects, setOngoingProjects] = useState<any[]>([]);
    const [archivedProjects, setArchivedProjects] = useState<any[]>([]);

    const [threads, setThreads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // FIX #12: fetch skills from Supabase profile, not stale localStorage
    const [studentProfileSkills, setStudentProfileSkills] = useState<string[]>([]);

    useEffect(() => {
        if (!userId) return;
        supabase.from('profiles').select('skills').eq('id', userId).maybeSingle().then(({ data }) => {
            if (data?.skills) setStudentProfileSkills(data.skills);
        });
    }, [userId]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    // Sync hash with activeTab for mobile bottom navigation support
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash === '#applications') setActiveTab('applied');
            else if (hash === '#projects') setActiveTab('ongoing');
            else if (hash === '#messages') setActiveTab('messages');
            else if (hash === '#analytics') setActiveTab('analytics');
        };
        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchThreads = async () => {
            if (!userId) return;

            try {
                const { data: threadsData, error } = await supabase
                    .from('message_threads')
                    .select(`
                        id,
                        project_id,
                        status,
                        created_at,
                        updated_at,
                        projects (
                            id,
                            role,
                            recruiter_id
                        ),
                        messages (
                            id,
                            sender_id,
                            content,
                            attached_file_name,
                            created_at
                        )
                    `)
                    .eq('student_id', userId)
                    .order('updated_at', { ascending: false });

                if (error) throw error;

                if (isMounted && threadsData) {
                    // We need to extract the recruiter IDs from the related projects 
                    const extractProjectData = (prj: any) => Array.isArray(prj) ? prj[0] : prj;
                    
                    const recruiterIds = [...new Set(threadsData.map((t: any) => {
                        const prj = extractProjectData(t.projects);
                        return prj ? prj.recruiter_id : null;
                    }))].filter(Boolean);

                    let recruitersMap: Record<string, string> = {};
                    if (recruiterIds.length > 0) {
                        const { data: recruitersData } = await supabase
                            .from('profiles')
                            .select('id, name')
                            .in('id', recruiterIds);

                        if (recruitersData) {
                            recruitersData.forEach(r => recruitersMap[r.id] = r.name);
                        }
                    }

                    let companyMap: Record<string, string> = {};
                    if (recruiterIds.length > 0) {
                        const { data: companyData } = await supabase
                            .from('profiles')
                            .select('id, company_name')
                            .in('id', recruiterIds);

                        if (companyData) {
                            companyData.forEach(r => companyMap[r.id] = r.company_name);
                        }
                    }

                    const mappedThreads = threadsData.map((t: any) => {
                        const prj = extractProjectData(t.projects);
                        const rId = prj ? prj.recruiter_id : null;
                        
                        return {
                            id: t.id,
                            projectId: t.project_id,
                            recruiterId: rId,
                            status: t.status,
                            projectName: prj ? prj.role : 'Project',
                            companyName: rId ? companyMap[rId] : 'Company',
                            recruiterName: rId ? recruitersMap[rId] : 'Recruiter',
                            messages: (t.messages || [])
                                .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                .map((m: any) => ({
                                    id: m.id,
                                    senderId: m.sender_id === userId ? 'student' : 'recruiter',
                                    text: m.content,
                                    attachedFileName: m.attached_file_name,
                                    timestamp: m.created_at
                                }))
                        };
                    });
                    setThreads(mappedThreads);
                }
            } catch (err) {
                console.error("Error fetching message threads:", err);
            }
        };

        fetchThreads();

        // Subscribe to messages table inserts
        const channel = supabase.channel('student_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchThreads)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, fetchThreads)
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const fetchStudentData = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
                // Fetch applications joined with their respective projects
                const { data: applicationsData, error } = await supabase
                    .from('applications')
                    .select(`
                        id,
                        status,
                        cover_letter,
                        availability,
                        portfolio_url,
                        applied_at,
                        projects (
                            id,
                            role,
                            domain,
                            tenure,
                            remuneration,
                            status,
                            created_at,
                            recruiter:profiles!projects_recruiter_id_fkey (
                                company_name
                            )
                        )
                    `)
                    .eq('student_id', userId);

                if (error) throw error;

                const applied: any[] = [];
                const interviews: any[] = [];
                const ongoing: any[] = [];
                const archived: any[] = [];

                if (applicationsData) {
                    applicationsData.forEach(app => {
                        // Reshape to fit expected UI format (using project data)
                        const prj = Array.isArray(app.projects) ? app.projects[0] : app.projects;
                        if (!prj) return; // safety

                        const recruiterObj = Array.isArray(prj.recruiter) ? prj.recruiter[0] : prj.recruiter;
                        const companyName = recruiterObj?.company_name || 'Acme Corp';

                        const mappedProject = {
                            id: prj.id,
                            title: prj.role,
                            category: prj.domain,
                            duration: prj.tenure,
                            remuneration: prj.remuneration,
                            type: 'Remote',
                            company: companyName,
                            tags: [prj.domain, "React", "Node.js"],
                            postedAt: prj.created_at,
                            appStatus: app.status,
                            applicationDetails: {
                                coverLetter: app.cover_letter,
                                availability: app.availability,
                                portfolioUrl: app.portfolio_url,
                                appliedAt: app.applied_at
                            }
                        };

                        switch (app.status) {
                            case 'pending':
                            case 'reviewing':
                            case 'shortlisted':
                                applied.push(mappedProject);
                                break;
                            case 'interview':
                                interviews.push(mappedProject);
                                break;
                            case 'accepted':
                            case 'working':
                                ongoing.push(mappedProject);
                                break;
                            case 'completed':
                            case 'rejected':
                            case 'declined':
                                archived.push({
                                    ...mappedProject,
                                    archiveStatus: app.status === 'completed' ? 'Completed' : 'Rejected',
                                    archiveStatusColor: app.status === 'completed' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
                                });
                                break;
                            default:
                                applied.push(mappedProject);
                        }
                    });
                }

                setAppliedProjects(applied);
                setInterviewProjects(interviews);
                setOngoingProjects(ongoing);
                setArchivedProjects(archived);
            } catch (err: any) {
                console.error("Error fetching student dashboard:", err);
                toast.error("Failed to load your applications.");
            } finally {
                setIsLoading(false);
            }
    }, [userId]);

    useEffect(() => {
        fetchStudentData();

        // FIX #14: Subscribe to application updates for real-time notifications
        const appsChannel = supabase.channel('student_applications')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'applications', filter: `student_id=eq.${userId}` },
                (payload: any) => {
                    const newStatus = payload.new.status;
                    const oldStatus = payload.old.status;
                    
                    if (newStatus !== oldStatus) {
                        let message = `An application status was updated to ${newStatus}!`;
                        if (newStatus === 'accepted') message = `🎉 Congratulations! You have been accepted for an interview!`;
                        if (newStatus === 'working') message = `🚀 You've been hired! Your project is now ongoing.`;
                        if (newStatus === 'rejected') message = `An application was politely declined. Keep trying!`;
                        
                        toast(message, { 
                            icon: newStatus === 'accepted' || newStatus === 'working' ? '🎉' : '🔔',
                            duration: 6000,
                        });
                        fetchStudentData(); // Refresh the list
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(appsChannel);
        };
    }, [userId, activeTab, fetchStudentData]);

    if (isLoading) {
        return (
            <div className="pt-24 pb-12 bg-slate-50 dark:bg-[#0a0f1c] min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-serif mb-2">My Applications</h1>
                </div>
                <PageSkeleton type="dashboard" />
            </div>
        );
    }

    if (userRole !== 'student') {
        return (
            <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold">Unauthorized. Students only.</h2>
            </div>
        );
    }

    const renderProjectsList = (projects: any[], emptyMessage: string, iconType: 'archive' | 'rejected' | 'briefcase' = 'briefcase') => {
        if (projects.length === 0) {
            return (
                <div className="col-span-full relative overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[2rem] border border-slate-200/60 dark:border-slate-800 p-8 sm:p-12 text-center flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-500 shadow-xl shadow-brand-500/5">
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32"></div>
                    
                    <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-3xl mb-6 flex items-center justify-center relative z-10 border border-slate-200 dark:border-slate-700">
                        {iconType === 'archive' && <Archive className="w-12 h-12 text-slate-400" />}
                        {iconType === 'rejected' && <XCircle className="w-12 h-12 text-slate-400" />}
                        {iconType === 'briefcase' && <Briefcase className="w-12 h-12 text-brand-500" />}
                    </div>
                    
                    <h3 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-3 relative z-10">
                        {iconType === 'briefcase' && activeTab === 'applied' ? "Ready to start your journey?" : "Nothing to see here... yet"}
                    </h3>
                    
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-lg relative z-10">
                        {iconType === 'briefcase' && activeTab === 'applied' 
                            ? "You haven't applied to any live projects yet. There are hundreds of active opportunities waiting for you." 
                            : emptyMessage}
                    </p>

                    {iconType === 'briefcase' && (
                        <button
                            onClick={() => navigate('/projects')}
                            className="mt-8 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 relative z-10 btn-interactive text-lg"
                        >
                            <CalendarCheck className="w-5 h-5" />
                            Discover Active Projects
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                {projects.map(project => (
                    <div
                        key={project.id}
                        className="glass-card p-4 sm:p-6 flex flex-col group/card hover:border-brand-500/50 transition-all"
                    >
                        <div className="mb-4 flex items-start justify-between">
                            <span className="inline-flex px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-700 dark:text-brand-300 text-xs font-bold tracking-widest uppercase">
                                {project.category}
                            </span>
                            {activeTab === 'ongoing' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Hired
                                </span>
                            )}
                            {activeTab === 'archived' && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${(project as any).archiveStatusColor}`}>
                                    <Archive className="w-3.5 h-3.5" /> {(project as any).archiveStatus}
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
                            {project.title}
                        </h3>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center font-bold text-sm text-slate-500 border border-slate-200 dark:border-slate-800">
                                {project.company.charAt(0)}
                            </div>
                            <span className="text-slate-600 dark:text-slate-400 font-semibold text-sm">
                                {project.company}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-5 p-4 rounded-xl bg-slate-50/50 dark:bg-[#030712]/50 border border-slate-100 dark:border-slate-800/50 text-sm font-medium">
                            <div className="flex items-center text-slate-500 dark:text-slate-400">
                                <Clock className="w-4 h-4 mr-2 text-brand-500" /> {project.duration}
                            </div>
                            <div className="flex items-center text-slate-500 dark:text-slate-400">
                                <Home className="w-4 h-4 mr-2 text-purple-500" /> {project.type}
                            </div>
                            <div className="flex items-center text-slate-700 dark:text-slate-300 font-semibold col-span-2">
                                <Banknote className="w-4 h-4 mr-2 text-emerald-500" />
                                {project.remuneration === '0' ? 'Unpaid' : `₹${project.remuneration}/month`}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                            {project.tags.slice(0, 3).map((tag: string) => (
                                <span key={tag} className="flex items-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                    <Tag className="w-3 h-3 mr-1 opacity-50" /> {tag}
                                </span>
                            ))}
                        </div>

                        {/* Application Lifecycle Timeline */}
                        <div className="mt-2 mb-5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Application Status</span>
                                <span className={`text-[10px] font-bold ${studentFriendlyStatus(project.appStatus || 'pending').color}`}>
                                    {studentFriendlyStatus(project.appStatus || 'pending').label}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {['applied', 'reviewing', 'shortlisted', 'interview', 'accepted'].map((stage, idx) => {
                                    const currentStatus = project.appStatus || 'pending';
                                    const statusOrder = ['pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'working', 'completed'];
                                    
                                    let isCompleted = false;
                                    let isActive = false;
                                    let isFailed = (currentStatus === 'rejected' || currentStatus === 'declined') && idx === 4;

                                    const currentIdxInOrder = statusOrder.indexOf(currentStatus);
                                    const stageIdxInOrder = statusOrder.indexOf(stage);

                                    if (currentIdxInOrder >= stageIdxInOrder && currentIdxInOrder !== -1) {
                                        isCompleted = true;
                                    }
                                    if (stage === 'accepted' && (currentStatus === 'accepted' || currentStatus === 'working' || currentStatus === 'completed')) {
                                        isCompleted = true;
                                    }
                                    if (stage === 'pending' && currentStatus === 'pending') {
                                        isActive = true;
                                    } else if (currentStatus === stage) {
                                        isActive = true;
                                    }

                                    return (
                                        <div key={stage} className="flex-1 flex flex-col items-center gap-1 relative">
                                            <div className={`h-1 w-full rounded-full transition-colors duration-300 ${
                                                isFailed
                                                    ? 'bg-red-500'
                                                    : isActive
                                                    ? 'bg-brand-500'
                                                    : isCompleted
                                                    ? 'bg-brand-600'
                                                    : 'bg-slate-200 dark:bg-slate-800'
                                            }`} />
                                            <span className={`text-[7px] font-extrabold tracking-wider uppercase truncate max-w-full ${
                                                isFailed
                                                    ? 'text-red-500'
                                                    : isActive
                                                    ? 'text-brand-600 dark:text-brand-400'
                                                    : isCompleted
                                                    ? 'text-slate-600 dark:text-slate-400'
                                                    : 'text-slate-400 dark:text-slate-650'
                                            }`}>
                                                {stage === 'accepted' ? (isFailed ? 'Declined' : 'Hired') : stage === 'pending' ? 'Applied' : stage}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <div className="flex items-center">
                                <Calendar className="w-3.5 h-3.5 mr-1" /> Applied {timeAgo(project.postedAt)}
                            </div>
                            <div className="flex items-center gap-2">
                                {activeTab === 'applied' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setViewingApplicationId(project.id);
                                        }}
                                        className="text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-700 dark:hover:text-brand-300"
                                    >
                                        View Application
                                    </button>
                                )}
                                {activeTab === 'ongoing' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDownloadingLetter({ projectId: project.id, type: 'Offer Letter' });

                                            // Simulate downloading and then auto-close
                                            setTimeout(() => {
                                                setDownloadingLetter(null);
                                            }, 2500);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 rounded-lg font-semibold transition-colors btn-interactive"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Offer Letter
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderStudentAnalytics = () => {
        const total = appliedProjects.length + interviewProjects.length + ongoingProjects.length + archivedProjects.length;
        const responded = interviewProjects.length + ongoingProjects.length + archivedProjects.filter(p => p.archiveStatus === 'Rejected' || p.archiveStatus === 'Completed').length;
        const shortlisted = interviewProjects.length + ongoingProjects.length + archivedProjects.filter(p => p.archiveStatus === 'Completed').length;
        
        const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
        const shortlistRate = total > 0 ? Math.round((shortlisted / total) * 100) : 0;
        
        // FIX #12: use live Supabase skills instead of localStorage
        const studentSkills = studentProfileSkills;
        const requiredSkills = ['React', 'Node.js', 'TypeScript', 'Figma', 'Python', 'SEO', 'AWS', 'TensorFlow'];
        const missingSkills = requiredSkills.filter(s => !studentSkills.includes(s)).slice(0, 3);

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Application Response Rate</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{responseRate}%</span>
                            <span className="text-xs text-green-600 font-bold">Excellent standing</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                            Recruiters have processed {responded} out of your {total} total applications.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shortlist / Hired Rate</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{shortlistRate}%</span>
                            <span className="text-xs text-brand-600 font-bold">Top 15% of candidates</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                            You were shortlisted or hired for {shortlisted} projects out of your total pool.
                        </p>
                    </div>
                </div>

                {/* Skill Gaps Analysis */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">AI Skill Gap Analysis</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        We compared your profile tags against matching criteria in active projects. Adding these skills to your portfolio will increase your visibility to recruiters by up to 40%:
                    </p>
                    
                    <div className="space-y-4">
                        {missingSkills.map(skill => (
                            <div key={skill} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{skill}</span>
                                </div>
                                <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded">
                                    High Demand
                                </span>
                            </div>
                        ))}
                        {missingSkills.length === 0 && (
                            <p className="text-sm text-green-600 font-semibold">You have all in-demand project skills! Your profile is in perfect standing.</p>
                        )}
                    </div>
                </div>

                {/* Insight-Led Recommendations */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-500 inline-block"></span>
                        What to Do Next
                    </h3>
                    <div className="space-y-3 text-sm font-sans">
                        {interviewProjects.length > 0 && (
                            <div className="flex gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                                <span className="text-purple-500 text-base shrink-0">🗓</span>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <strong>You have {interviewProjects.length} active interview{interviewProjects.length > 1 ? 's' : ''}.</strong> Respond to interview invitations within 24 hours — candidates who respond quickly are 3× more likely to receive an offer.
                                </p>
                            </div>
                        )}
                        {responseRate > 0 && responseRate < 40 && (
                            <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                                <span className="text-amber-500 text-base shrink-0">✍️</span>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <strong>Your response rate is {responseRate}%.</strong> Personalise each cover letter to the specific project deliverables — generic applications are filtered out 2× faster by AI screening systems.
                                </p>
                            </div>
                        )}
                        {missingSkills.length > 0 && (
                            <div className="flex gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                                <span className="text-indigo-500 text-base shrink-0">📈</span>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <strong>Add {missingSkills.slice(0, 2).join(' and ')} to your profile</strong> to unlock more high-paying project matches. These are the most-requested skills across active listings this week.
                                </p>
                            </div>
                        )}
                        {total === 0 && (
                            <div className="flex gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <span className="text-slate-400 text-base shrink-0">🚀</span>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Apply to your first project to start tracking your analytics. Even one well-targeted application generates valuable insights for future applications.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative min-h-screen pt-32 pb-20 bg-slate-50 dark:bg-[#030712] transition-colors duration-500">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[0%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/10 dark:bg-brand-500/5 blur-[120px] mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] mix-blend-multiply dark:mix-blend-screen"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                
                {/*  --- NEW: Welcome Analytics Card --- */}
                <div className="mb-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                        
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                                Welcome back, <span className="text-brand-600 dark:text-brand-400">{userName}</span>
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 text-lg">
                                Ready to take the next step in your career? Here is your current standing today.
                            </p>
                        </div>

                        {/* Profile Completion Mini-Widget */}
                        <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Profile Strength</span>
                                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">80%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                                <div className="h-full bg-brand-500 w-[80%] rounded-full"></div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                You are <span className="font-semibold text-slate-750 dark:text-slate-200">20%</span> away from being an All-Star. Uploading a resume highly increases selection rates!
                            </p>
                        </div>
                    </div>

                    {/* Stat Pills */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{appliedProjects.length}</p>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <CalendarCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{interviewProjects.length}</p>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Interviews</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{ongoingProjects.length}</p>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects Hired</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{threads.length}</p>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Chats</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/*  --- END Welcome Analytics Card --- */}

                {/* Next Best Action Banner */}
                <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-brand-500/10 via-purple-500/5 to-transparent border border-brand-500/20 dark:border-brand-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-500 text-white rounded-xl shadow-md">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-brand-650 dark:text-brand-400 uppercase tracking-wider">Next Best Action</h4>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                                {interviewProjects.length > 0 
                                    ? `You have an active interview invitation for "${interviewProjects[0].title}". View messages to respond.`
                                    : appliedProjects.length > 0
                                    ? `Address key skill gaps in the Workspace Analytics tab to boost your AI Compatibility Match by up to 40%.`
                                    : `Start matching with active projects! Browse open listings and apply today to build your portfolio.`
                                }
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if (interviewProjects.length > 0) {
                                setActiveTab('messages');
                            } else if (appliedProjects.length > 0) {
                                setActiveTab('analytics');
                            } else {
                                navigate('/projects');
                            }
                        }}
                        className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs hover:-translate-y-0.5 transition-all shadow-sm hover:shadow shrink-0"
                    >
                        {interviewProjects.length > 0 ? "Open Messages" : appliedProjects.length > 0 ? "Check Analytics" : "Browse Projects"}
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar / Navigation Cards (Hidden on Mobile) */}
                    <div className="hidden lg:flex flex-col w-64 flex-shrink-0 space-y-3">
                        <button
                            onClick={() => { setActiveTab('applied'); window.location.hash = ''; }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'applied'
                                ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-500 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <span className="flex items-center font-bold">
                                <Briefcase className={`w-5 h-5 mr-3 ${activeTab === 'applied' ? 'text-white' : 'text-brand-500'}`} />
                                Applied
                            </span>
                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${activeTab === 'applied' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                {appliedProjects.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('interviews'); window.location.hash = ''; }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'interviews'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <span className="flex items-center font-bold">
                                <CalendarCheck className={`w-5 h-5 mr-3 ${activeTab === 'interviews' ? 'text-white' : 'text-amber-500'}`} />
                                Interviews
                            </span>
                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${activeTab === 'interviews' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                {interviewProjects.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('ongoing'); window.location.hash = ''; }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'ongoing'
                                ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-green-600 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <span className="flex items-center font-bold">
                                <CheckCircle2 className={`w-5 h-5 mr-3 ${activeTab === 'ongoing' ? 'text-white' : 'text-green-500'}`} />
                                Ongoing
                            </span>
                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${activeTab === 'ongoing' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                {ongoingProjects.length}
                            </span>
                        </button>



                        <button
                            onClick={() => { setActiveTab('messages'); window.location.hash = ''; }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'messages'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-600 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <span className="flex items-center font-bold">
                                <MessageSquare className={`w-5 h-5 mr-3 ${activeTab === 'messages' ? 'text-white' : 'text-purple-500'}`} />
                                Messages
                            </span>
                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${activeTab === 'messages' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                {threads.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('archived'); window.location.hash = ''; }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'archived'
                                ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-700 shadow-md shadow-slate-900/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-500 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <span className="flex items-center font-bold">
                                <Archive className={`w-5 h-5 mr-3 ${activeTab === 'archived' ? 'text-white' : 'text-slate-500'}`} />
                                Archived
                            </span>
                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${activeTab === 'archived' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                {archivedProjects.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('analytics'); window.location.hash = ''; }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${activeTab === 'analytics'
                                ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-500 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <span className="flex items-center font-bold">
                                <TrendingUp className={`w-5 h-5 mr-3 ${activeTab === 'analytics' ? 'text-white' : 'text-brand-500'}`} />
                                Workspace Analytics
                            </span>
                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${activeTab === 'analytics' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                metrics
                            </span>
                        </button>
                    </div>

                    {/* Desktop Main Content Area (Hidden on Mobile unless hash is active) */}
                    <div className="hidden lg:block flex-1">
                        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                                {activeTab} Projects
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {activeTab === 'applied' && "Projects you have recently applied to."}
                                {activeTab === 'interviews' && "Projects where you have been accepted for an interview."}
                                {activeTab === 'ongoing' && "Congratulations! You have been hired for these projects."}
                                {activeTab === 'messages' && "Communications with recruiters for your applied projects."}
                                {activeTab === 'archived' && "Projects that have concluded. View them here, but completion certificates live on the Completed Projects page."}
                                {activeTab === 'analytics' && "Track your application lifecycle conversion and address skill gaps."}
                            </p>
                        </div>

                        {activeTab === 'applied' && renderProjectsList(appliedProjects, "You haven't applied to any live projects yet. Start hunting to build your portfolio!", 'briefcase')}
                        {activeTab === 'interviews' && renderProjectsList(interviewProjects, "You don't have any scheduled interviews right now. Keep applying to land one!", 'briefcase')}
                        {activeTab === 'ongoing' && renderProjectsList(ongoingProjects, "You aren't currently part of any active selections. Your time will come!", 'briefcase')}
                        {activeTab === 'messages' && <StudentMessagingHub threads={threads} />}
                        {activeTab === 'archived' && renderProjectsList(archivedProjects, "None of your recent applications have been archived yet.", 'archive')}
                        {activeTab === 'analytics' && renderStudentAnalytics()}
                    </div>

                    {/* Mobile Unified Main Content Area */}
                    <div className="block lg:hidden flex-1 space-y-8">
                        {/* If they tapped a specific tab on the bottom nav, show only that */}
                        {window.location.hash === '#applications' && (
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">My Applications</h2>
                                {renderProjectsList(appliedProjects, "You haven't applied to any live projects yet.", 'briefcase')}
                            </div>
                        )}
                        {window.location.hash === '#projects' && (
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Active Projects</h2>
                                {renderProjectsList(ongoingProjects, "You don't have any active projects right now.", 'briefcase')}
                            </div>
                        )}
                        {window.location.hash === '#messages' && (
                            <StudentMessagingHub threads={threads} />
                        )}
                        {window.location.hash === '#analytics' && (
                            renderStudentAnalytics()
                        )}
                        
                        {/* If they are on the default home view (no hash), show the vertical Action-Oriented feed */}
                        {(!window.location.hash || window.location.hash === '') && (
                            <>
                                {/* Action Required */}
                                {(interviewProjects.length > 0 || ongoingProjects.length > 0) && (
                                    <section>
                                        <h3 className="text-lg font-bold text-brand-600 dark:text-brand-400 mb-4 flex items-center gap-2">
                                            <CalendarCheck className="w-5 h-5" /> Action Required
                                        </h3>
                                        <div className="space-y-4">
                                            {renderProjectsList(interviewProjects, "", 'briefcase')}
                                            {renderProjectsList(ongoingProjects, "", 'briefcase')}
                                        </div>
                                    </section>
                                )}

                                {/* Quick Links */}
                                <section className="grid grid-cols-2 gap-4">
                                    <button onClick={() => window.location.hash = '#messages'} className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 rounded-2xl text-purple-700 dark:text-purple-400 gap-2 font-semibold">
                                        <MessageSquare className="w-6 h-6" />
                                        Messages
                                    </button>
                                    <button onClick={() => window.location.hash = '#analytics'} className="flex flex-col items-center justify-center p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50 rounded-2xl text-brand-700 dark:text-brand-400 gap-2 font-semibold">
                                        <TrendingUp className="w-6 h-6" />
                                        Analytics
                                    </button>
                                </section>

                                {/* Recent Activity */}
                                <section>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Applications</h3>
                                    {renderProjectsList(appliedProjects.slice(0, 5), "You haven't applied to any live projects yet.", 'briefcase')}
                                </section>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* View Application Modal */}
            {viewingApplicationId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setViewingApplicationId(null)}
                    />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-brand-500/10 border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                            <div>
                                <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                                    Application Details
                                </h2>
                                <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mt-0.5">
                                    {appliedProjects.find(p => p.id === viewingApplicationId)?.title || archivedProjects.find(p => p.id === viewingApplicationId)?.title} at {appliedProjects.find(p => p.id === viewingApplicationId)?.company || archivedProjects.find(p => p.id === viewingApplicationId)?.company}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingApplicationId(null)}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto hide-scrollbar space-y-6">
                            {(() => {
                                const appProject = [...appliedProjects, ...interviewProjects, ...ongoingProjects, ...archivedProjects].find((a: any) => a.id === viewingApplicationId);
                                if (!appProject || !appProject.applicationDetails) return <p>Application not found.</p>;
                                const appDetails = appProject.applicationDetails;
                                return (
                                    <>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cover Letter</h3>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                                {appDetails.coverLetter}
                                            </div>
                                        </div>
                                        {appDetails.portfolioUrl && (
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Portfolio URL</h3>
                                                <a href={appDetails.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">
                                                    {appDetails.portfolioUrl}
                                                </a>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Availability</h3>
                                            <p className="text-slate-700 dark:text-slate-300 capitalize">{appDetails.availability.replace(/_/g, ' ')}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Applied On</h3>
                                            <p className="text-slate-700 dark:text-slate-300">{new Date(appDetails.appliedAt).toLocaleDateString()}</p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Download Popup */}
            {downloadingLetter && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center mb-4 text-brand-500">
                            <Download className="w-8 h-8 animate-bounce" />
                        </div>
                        <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
                            Downloading {downloadingLetter.type}...
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Please wait while we prepare your document.
                        </p>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-6 overflow-hidden">
                            <div className="bg-brand-500 h-full rounded-full animate-pulse w-full origin-left shrink-0 transition-all duration-1000"></div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
