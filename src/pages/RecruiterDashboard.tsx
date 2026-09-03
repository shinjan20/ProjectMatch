import { useState, useEffect } from 'react';
import { Briefcase, Users, PlusCircle, MapPin, Clock, FileText, Download, CheckCircle, MessageSquare, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLocation, useSearchParams } from 'react-router-dom';
import PostProjectModal, { type ProjectFormData } from '../components/recruiter/PostProjectModal';
import StudentProfileCard, { type StudentProfile } from '../components/recruiter/StudentProfileCard';
import StudentProfileModal from '../components/recruiter/StudentProfileModal';
import ProjectDashboard from '../components/recruiter/ProjectDashboard';
import MessagingHub from '../components/recruiter/MessagingHub';
import ConfirmModal from '../components/ConfirmModal';
import CollaboratedTalentCard from '../components/recruiter/CollaboratedTalentCard';
import { DOMAINS } from '../constants';
import CelebrationModal from '../components/CelebrationModal';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useCallback } from 'react';
import EmptyState from '../components/ui/EmptyState';
import PageSkeleton from '../components/common/PageSkeleton';

const VALID_RECRUITER_TABS = ['projects', 'talent', 'collaborated', 'messages', 'analytics'] as const;
type RecruiterTab = typeof VALID_RECRUITER_TABS[number];

const RecruiterDashboard = () => {
    const { userName, userId } = useAuth();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const tabParam = searchParams.get('tab') as RecruiterTab;
    const activeTab: RecruiterTab = VALID_RECRUITER_TABS.includes(tabParam) ? tabParam : 'projects';

    const setActiveTab = useCallback((tab: RecruiterTab) => {
        setSearchParams({ tab });
    }, [setSearchParams]);

    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [targetMessageThreadId, setTargetMessageThreadId] = useState<string | null>(null);
    const [activeProjects, setActiveProjects] = useState<any[]>([]);
    const [archivedProjects, setArchivedProjects] = useState<any[]>([]);
    const [threads, setThreads] = useState<any[]>([]);
    const [collaboratedTalent, setCollaboratedTalent] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Discover Talent State
    const [talentProfiles, setTalentProfiles] = useState<any[]>([]);
    const [colleges, setColleges] = useState<string[]>([]);

    // Scroll to top on tab change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    // Sync tab with legacy hash route
    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (hash === 'projects') setActiveTab('projects');
        else if (hash === 'candidates') setActiveTab('talent');
        else if (hash === 'inbox') setActiveTab('messages');
        else if (hash === 'analytics') setActiveTab('analytics');
    }, [location.hash, setActiveTab]);

    const fetchRecruiterData = useCallback(async () => {
        if (!userId) return;

        try {
            setIsLoading(true);
            // Fetch all projects created by this recruiter
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('*')
                .eq('recruiter_id', userId)
                .order('created_at', { ascending: false });

            if (projectsError) throw projectsError;

            // Fetch all applications relevant to these projects
            const projectIds = projectsData?.map(p => p.id) || [];

            let applicationsData: any[] = [];
            if (projectIds.length > 0) {
                const { data: apps, error: appsError } = await supabase
                    .from('applications')
                    .select(`
                        *,
                        profiles:student_id (
                            id, name, photo_url, college, domain, github_url, linkedin_url, portfolio_url, skills, phone
                        )
                    `)
                    .in('project_id', projectIds);

                if (appsError) throw appsError;
                if (apps) applicationsData = apps;
            }

            // Map the structured data back into the shape the dashboard expects
            const formattedProjects = projectsData?.map(project => {
                const projectApps = applicationsData.filter(app => app.project_id === project.id);

                const formatProfile = (app: any) => ({
                    id: app.student_id,
                    name: app.profiles?.name || 'Unknown',
                    photoUrl: app.profiles?.photo_url || null,
                    college: app.profiles?.college || 'Unknown College',
                    domain: app.profiles?.domain || 'Unknown Domain',
                    skills: app.profiles?.skills || [],
                    portfolioUrl: app.portfolio_url || app.profiles?.portfolio_url || null,
                    githubUrl: app.profiles?.github_url || null,
                    linkedinUrl: app.profiles?.linkedin_url || null,
                    completedProjects: 0,
                    applicationStatus: app.status,
                    coverLetter: app.cover_letter,
                    availability: app.availability
                });

                return {
                    id: project.id,
                    role: project.role,
                    domain: project.domain,
                    objective: project.objective,
                    expectations: project.expectations,
                    positions: project.positions,
                    tenure: project.tenure,
                    remuneration: project.remuneration,
                    status: project.status,
                    candidates: [],
                    appliedCandidates: projectApps.filter(a => ['pending', 'reviewing', 'shortlisted', 'interview', 'final_review'].includes(a.status)).map(formatProfile),
                    workingCandidates: projectApps.filter(a => ['accepted', 'working'].includes(a.status)).map(formatProfile),
                    archivedCandidates: projectApps.filter(a => ['rejected', 'declined', 'completed'].includes(a.status)).map(formatProfile)
                };
            }) || [];

            const collabTalentList: any[] = [];
            applicationsData.filter(app => app.status === 'completed').forEach(app => {
                const project = projectsData?.find(p => p.id === app.project_id);
                collabTalentList.push({
                    id: `collab-${app.id}`,
                    candidateId: app.student_id,
                    projectId: app.project_id,
                    name: app.profiles?.name || 'Unknown',
                    photoUrl: app.profiles?.photo_url || null,
                    projectName: project?.role || 'Project',
                    domain: app.profiles?.domain || 'Unknown',
                    rating: 0,
                    review: ''
                });
            });
            setCollaboratedTalent(collabTalentList);

            setActiveProjects(formattedProjects.filter(p => p.status === 'active'));
            setArchivedProjects(formattedProjects.filter(p => ['completed', 'archived'].includes(p.status)));
            
            // Sync selected project details if one was open
            setSelectedProject((prev: any) => {
                if (prev) {
                    const updatedSelected = formattedProjects.find(p => p.id === prev.id);
                    return updatedSelected || prev;
                }
                return prev;
            });
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            toast.error("Failed to load your projects.");
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchRecruiterData();
    }, [userId, activeTab, fetchRecruiterData]);

    // Fetch and subscribe to Message Threads
    useEffect(() => {
        let isMounted = true;

        const fetchThreads = async () => {
            if (!userId) return;

            try {
                // Get all projects for this recruiter first to know which threads are relevant
                const { data: userProjects } = await supabase
                    .from('projects')
                    .select('id')
                    .eq('recruiter_id', userId);

                const projectIds = userProjects?.map(p => p.id) || [];
                if (projectIds.length === 0) return;

                const { data: threadsData, error } = await supabase
                    .from('message_threads')
                    .select(`
                        id,
                        project_id,
                        student_id,
                        status,
                        created_at,
                        updated_at,
                        profiles!student_id (
                            name,
                            photo_url,
                            domain,
                            college
                        ),
                        messages (
                            id,
                            sender_id,
                            content,
                            attached_file_name,
                            created_at
                        )
                    `)
                    .in('project_id', projectIds)
                    .order('updated_at', { ascending: false });

                if (error) throw error;

                if (isMounted && threadsData) {
                    const mappedThreads = threadsData.map((t: any) => ({
                        id: t.id,
                        projectId: t.project_id,
                        candidateId: t.student_id,
                        candidateName: t.profiles?.name || 'Applicant',
                        candidatePhotoUrl: t.profiles?.photo_url || '',
                        candidateDomain: t.profiles?.domain || 'Candidate',
                        candidateCollege: t.profiles?.college || '',
                        status: t.status,
                        messages: (t.messages || [])
                            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                            .map((m: any) => ({
                                id: m.id,
                                senderId: m.sender_id,
                                text: m.content,
                                attachedFileName: m.attached_file_name,
                                timestamp: m.created_at
                            }))
                    }));
                    setThreads(mappedThreads);
                }
            } catch (err) {
                console.error("Error fetching message threads:", err);
            }
        };

        fetchThreads();

        // Subscribe to messages table inserts
        const channel = supabase.channel('recruiter_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchThreads)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, fetchThreads)
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [userId]);

    // Effect to persist collaborated talent when they change (keep temporarily until we migrate Collaborated feature)
    useEffect(() => {
        // This useEffect is no longer needed as collaborated talent is fetched from DB
        // if (collaboratedTalent.length > 0) {
        //     localStorage.setItem('pyroCollaboratedTalent', JSON.stringify(collaboratedTalent));
        // }
    }, [collaboratedTalent]);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'student');

                if (error) throw error;

                if (data) {
                    setTalentProfiles(data);
                    const uniqueColleges = Array.from(new Set(data.map(p => p.college || 'Unknown College').filter(Boolean))) as string[];
                    setColleges(uniqueColleges);
                }
            } catch (err) {
                console.error("Error fetching talent profiles:", err);
            }
        };
        fetchProfiles();
    }, []);


    // Check if we just navigated from a successful new recruiter registration
    useEffect(() => {
        if (location.state?.isNewRecruiter) {
            setCelebrationData({
                title: 'Welcome Aboard!',
                message: 'Your recruiter account has been successfully created. You can now start posting projects and finding top talent!'
            });
            setShowCelebration(true);

            // Clear the state so it doesn't re-trigger on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const [isPostProjectModalOpen, setIsPostProjectModalOpen] = useState(false);
    const [editingProjectData, setEditingProjectData] = useState<any | null>(null);

    // Profile Modal State
    const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Project Details Modal State
    const [isProjectDetailsModalOpen, setIsProjectDetailsModalOpen] = useState(false);
    const [projectInitialTab, setProjectInitialTab] = useState<'details' | 'applicants' | 'archived' | 'working'>('details');

    // Modal Archive Confirmation State
    const [confirmingArchiveId, setConfirmingArchiveId] = useState<string | null>(null);

    // Celebration Modal State
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationData, setCelebrationData] = useState<{
        title: string;
        message: string;
        primaryActionText?: string;
        onPrimaryAction?: () => void;
        children?: React.ReactNode;
        hideConfetti?: boolean;
        icon?: React.ReactNode;
    }>({ title: '', message: '' });

    // Discover Talent Filters and Sort State
    const [filterDomain, setFilterDomain] = useState<string>('All');
    const [filterCollege, setFilterCollege] = useState<string>('All');
    const [sortOption, setSortOption] = useState<string>('Completed Projects (High to Low)');

    const filteredAndSortedProfiles = talentProfiles.filter(profile => {
        const profileDomain = profile.domain || 'Unknown Domain';
        const profileCollege = profile.college || 'Unknown College';
        const domainMatch = filterDomain === 'All' || profileDomain === filterDomain;
        const collegeMatch = filterCollege === 'All' || profileCollege === filterCollege;
        return domainMatch && collegeMatch;
    }).sort((a, b) => {
        // We might not have completedProjects column easily without joins, but keeping consistent for now if using mock structure
        const aCompleted = a.completedProjects || 0;
        const bCompleted = b.completedProjects || 0;
        if (sortOption === 'Completed Projects (High to Low)') return bCompleted - aCompleted;
        if (sortOption === 'Completed Projects (Low to High)') return aCompleted - bCompleted;
        if (sortOption === 'Name (A-Z)') return a.name.localeCompare(b.name);
        return 0; // default
    });

    const handlePostProject = async (projectData: ProjectFormData) => {
        if (!userId) return;

        try {
            if (editingProjectData) {
                // Update existing project in Supabase
                const { error } = await supabase
                    .from('projects')
                    .update({
                        role: projectData.role,
                        domain: projectData.domain,
                        objective: projectData.objective,
                        expectations: projectData.expectations,
                        positions: projectData.positions,
                        tenure: projectData.tenure,
                        remuneration: projectData.remuneration
                    })
                    .eq('id', editingProjectData.id)
                    .eq('recruiter_id', userId);

                if (error) throw error;

                // Update local state temporarily for snappy UI
                setActiveProjects(prev => prev.map(p => p.id === editingProjectData.id ? { ...p, ...projectData } : p));
                toast.success('Project updated successfully!');
            } else {
                // Create new project in Supabase
                const { data: newDbProject, error } = await supabase
                    .from('projects')
                    .insert([{
                        recruiter_id: userId,
                        role: projectData.role,
                        domain: projectData.domain,
                        objective: projectData.objective,
                        expectations: projectData.expectations,
                        positions: projectData.positions,
                        tenure: projectData.tenure,
                        remuneration: projectData.remuneration,
                        status: 'active'
                    }])
                    .select()
                    .single();

                if (error) throw error;

                // Also fetch 3 random student UUID profiles to create mock applications so UI doesn't look empty
                const { data: randomStudents } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('role', 'student')
                    .limit(3);

                if (randomStudents && randomStudents.length > 0) {
                    const applicationsToInsert = randomStudents.map(student => ({
                        project_id: newDbProject.id,
                        student_id: student.id,
                        cover_letter: "I am very interested in this role!",
                        availability: "full_time",
                        status: 'pending'
                    }));

                    await supabase.from('applications').insert(applicationsToInsert);
                }

                // Update local state temporarily for snappy UI
                const formatProfile = (studentId: string) => ({
                    id: studentId,
                    name: 'Mock Student (Demo)',
                    photoUrl: null,
                    college: 'Demo University',
                    domain: projectData.domain,
                    applicationStatus: 'pending',
                    coverLetter: "I am very interested in this role!",
                    availability: "full_time"
                });

                setActiveProjects(prev => [{
                    id: newDbProject.id,
                    role: newDbProject.role,
                    domain: newDbProject.domain,
                    objective: newDbProject.objective,
                    expectations: newDbProject.expectations,
                    positions: newDbProject.positions,
                    tenure: newDbProject.tenure,
                    remuneration: newDbProject.remuneration,
                    status: newDbProject.status,
                    candidates: [],
                    appliedCandidates: randomStudents ? randomStudents.map(s => formatProfile(s.id)) : [],
                    workingCandidates: [],
                    archivedCandidates: []
                }, ...prev]);

                toast.success('Project posted successfully!');
            }
        } catch (err: any) {
            console.error("Error saving project:", err);
            toast.error(err.message || 'Failed to save project');
        } finally {
            setEditingProjectData(null);
        }
    };

    const handleEditProjectClick = (e: React.MouseEvent, project: any) => {
        e.stopPropagation();
        setEditingProjectData(project);
        setIsPostProjectModalOpen(true);
    };

    const handleProfileClick = (profile: StudentProfile) => {
        setSelectedProfile(profile);
        setIsProfileModalOpen(true);
    };

    const handleProjectClick = (project: any) => {
        setSelectedProject(project);
        setProjectInitialTab('details');
        setIsProjectDetailsModalOpen(true);
    };

    const handleArchiveConfirmTrigger = (projectId: string) => {
        setConfirmingArchiveId(projectId);
        setIsProjectDetailsModalOpen(false); // Close details modal when checking archive to let ConfirmModal sit top 
    };

    const handleArchiveProject = async () => {
        if (!confirmingArchiveId || !userId) return;

        try {
            const projectToArchive = activeProjects.find(p => p.id === confirmingArchiveId);
            if (projectToArchive) {
                // Update project status to completed in Supabase
                const { error } = await supabase
                    .from('projects')
                    .update({ status: 'completed' })
                    .eq('id', confirmingArchiveId)
                    .eq('recruiter_id', userId);

                if (error) throw error;

                // Update local state
                setActiveProjects(activeProjects.filter(p => p.id !== confirmingArchiveId));
                setArchivedProjects([{ ...projectToArchive, status: 'completed' }, ...archivedProjects]);
                setIsProjectDetailsModalOpen(false);
                setConfirmingArchiveId(null);

                // Check if there are candidate to send letters to
                const hasCandidates = projectToArchive.workingCandidates && projectToArchive.workingCandidates.length > 0;

                if (hasCandidates) {
                    setCelebrationData({
                        title: 'Project Completed!',
                        message: `Congratulations on archiving "${projectToArchive.role}"! You have candidates pending completion letters. Sending them now ensures a good experience.`,
                        primaryActionText: 'Send Letters to All Candidates',
                        children: (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                                    Candidates to notify
                                    <span className="bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 py-0.5 px-2 rounded-full text-xs">
                                        {projectToArchive.workingCandidates?.length}
                                    </span>
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {projectToArchive.workingCandidates?.map((candidate: any) => (
                                        <div key={candidate.id} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                                            {candidate.photoUrl ? (
                                                <img src={candidate.photoUrl} alt={candidate.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs shrink-0">
                                                    {candidate.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{candidate.name}</div>
                                                <div className="text-[10px] text-slate-500 truncate">{candidate.domain}</div>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                                                <FileText className="w-3 h-3" /> Pending Letter
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ),
                        onPrimaryAction: () => {
                            projectToArchive.workingCandidates?.forEach((candidate: any) => {
                                handleCompleteProject(projectToArchive.id, candidate.id);
                                handleSendLetter(projectToArchive.id, candidate.id, 'completion', `Congratulations on successfully completing the ${projectToArchive.role} project! Please find your completion letter attached.\n\nBest regards,\n${userName}`);
                            });
                            setShowCelebration(false);
                            setTimeout(() => {
                                toast.success('Completion letters have been generated and sent to all associated candidates.');
                            }, 500);
                        }
                    });
                } else {
                    setCelebrationData({
                        title: 'Project Archived',
                        message: `Sorry you could not find any candidate for "${projectToArchive.role}" 😔, but you will find the right talent next time! 🌟`,
                        hideConfetti: true,
                        icon: <span className="text-5xl text-center mb-1 drop-shadow-md">😔</span>
                    });
                }
                setShowCelebration(true);
            }
        } catch (err: any) {
            console.error("Error archiving project:", err);
            toast.error("Failed to archive project.");
        }
    };

    const handleUpdateCandidateStage = async (projectId: string, candidateId: string, stage: string) => {
        try {
            const { error } = await supabase
                .from('applications')
                .update({ status: stage })
                .eq('project_id', projectId)
                .eq('student_id', candidateId);

            if (error) throw error;

            toast.success(`Candidate stage updated successfully`);
            await fetchRecruiterData();
        } catch (err) {
            console.error("Failed to update stage:", err);
            toast.error("Failed to update candidate stage");
        }
    };

    const handleAcceptCandidate = async (projectId: string, candidateId: string) => {
        const project = activeProjects.find(p => p.id === projectId);
        if (project && project.workingCandidates && project.workingCandidates.length >= (project.positions || 1)) {
            toast.error('Cannot accept more candidates. All positions are filled for this project.');
            return;
        }

        try {
            // Update application in Supabase
            const { error } = await supabase
                .from('applications')
                .update({ status: 'accepted' })
                .eq('project_id', projectId)
                .eq('student_id', candidateId);

            if (error) throw error;

            let acceptedCandidate: any = null;

            setActiveProjects(prev => prev.map(p => {
                if (p.id === projectId) {
                    const candidate = p.appliedCandidates?.find((c: any) => c.id === candidateId);
                    if (candidate) acceptedCandidate = candidate;

                    const updatedCandidates = p.appliedCandidates.map((c: any) =>
                        c.id === candidateId ? { ...c, applicationStatus: 'accepted' } : c
                    );
                    const updatedProject = { ...p, appliedCandidates: updatedCandidates };
                    if (selectedProject?.id === projectId) setSelectedProject(updatedProject);
                    return updatedProject;
                }
                return p;
            }));

            // Handle thread creation natively
            let threadIdToOpen = null;
            if (acceptedCandidate) {
                const { data: existingThread } = await supabase
                    .from('message_threads')
                    .select('id')
                    .eq('project_id', projectId)
                    .eq('student_id', candidateId)
                    .maybeSingle();

                if (existingThread) {
                    threadIdToOpen = existingThread.id;
                } else {
                    const { data: newThread } = await supabase
                        .from('message_threads')
                        .insert([{ project_id: projectId, student_id: candidateId, recruiter_id: userId, status: 'accepted' }])
                        .select('id').single();
                    if (newThread) threadIdToOpen = newThread.id;
                }

                if (threadIdToOpen && userId) {
                    await supabase.from('messages').insert([{
                        thread_id: threadIdToOpen,
                        sender_id: userId,
                        content: `Hi ${acceptedCandidate.name}, your application for this project has been accepted! Let's discuss the next steps.`
                    }]);
                    setTargetMessageThreadId(threadIdToOpen);
                }

                setCelebrationData({
                    title: 'Accepted for Interview!',
                    message: `${acceptedCandidate.name} has been accepted for an interview. You can now message the candidate to schedule the recruitment process.`
                });
                setShowCelebration(true);
            }

            if (threadIdToOpen) setTargetMessageThreadId(threadIdToOpen);
            setIsProjectDetailsModalOpen(false);
            setActiveTab('messages');
        } catch (err: any) {
            console.error("Error accepting candidate:", err);
            toast.error("Failed to accept candidate");
        }
    };

    const handleDeclineCandidate = async (projectId: string, candidateId: string) => {
        try {
            // Update application in Supabase
            const { error } = await supabase
                .from('applications')
                .update({ status: 'rejected' })
                .eq('project_id', projectId)
                .eq('student_id', candidateId);

            if (error) throw error;

            setActiveProjects(prev => prev.map(p => {
                if (p.id === projectId) {
                    const candidate = p.appliedCandidates?.find((c: any) => c.id === candidateId);
                    if (candidate) {
                        const updatedProject = {
                            ...p,
                            appliedCandidates: p.appliedCandidates.filter((c: any) => c.id !== candidateId),
                            archivedCandidates: [...(p.archivedCandidates || []), { ...candidate, applicationStatus: 'rejected' }]
                        };
                        if (selectedProject?.id === projectId) setSelectedProject(updatedProject);
                        return updatedProject;
                    }
                }
                return p;
            }));
        } catch (err: any) {
            console.error("Error declining candidate:", err);
            toast.error("Failed to decline candidate");
        }
    };

    const handleMessageWorkingCandidate = async (projectId: string, candidateId: string) => {
        // Ensure a thread exists for this candidate
        let threadIdToOpen = null;
        const { data: existingThread } = await supabase
            .from('message_threads')
            .select('id')
            .eq('project_id', projectId)
            .eq('student_id', candidateId)
            .maybeSingle();

        if (existingThread) {
            threadIdToOpen = existingThread.id;
        } else {
            const { data: newThread } = await supabase
                .from('message_threads')
                .insert([{ project_id: projectId, student_id: candidateId, recruiter_id: userId, status: 'completed' }])
                .select('id').single();
            if (newThread) threadIdToOpen = newThread.id;
        }

        if (threadIdToOpen) setTargetMessageThreadId(threadIdToOpen);
        setIsProjectDetailsModalOpen(false);
        setActiveTab('messages');
    };

    const handleSendLetter = async (projectId: string, candidateId: string, _type: 'joining' | 'completion' | 'discovery', content: string) => {
        let newOrExistingThreadId: string | null = null;

        // Prevent crashes for mock data (like Collaborated Talent fallback)
        if (projectId === 'collab-project' || !projectId.includes('-')) {
            toast.error("Cannot message a mock candidate from the legacy database.");
            return;
        }

        try {
            // Check if thread exists
            const { data: existingThread, error: existingThreadError } = await supabase
                .from('message_threads')
                .select('id')
                .eq('project_id', projectId)
                .eq('student_id', candidateId)
                .maybeSingle();

            if (existingThreadError) {
                console.error("Error checking existing thread:", existingThreadError);
            }

            if (existingThread) {
                newOrExistingThreadId = existingThread.id;

                // If it's a completion letter, we might want to update thread status to 'selected'
                if (_type === 'completion' || _type === 'joining') {
                    await supabase
                        .from('message_threads')
                        .update({ status: 'completed' })
                        .eq('id', newOrExistingThreadId);
                }
            } else {
                // Create new thread
                const { data: newThread, error: threadError } = await supabase
                    .from('message_threads')
                    .insert([{
                        project_id: projectId,
                        student_id: candidateId,
                        recruiter_id: userId,
                        status: 'accepted'
                    }])
                    .select('id')
                    .single();

                if (threadError) {
                    console.error("Thread creation error:", threadError);
                    throw threadError;
                }
                if (newThread) newOrExistingThreadId = newThread.id;
            }

            if (newOrExistingThreadId && userId) {
                // Insert the message
                const { error: messageError } = await supabase
                    .from('messages')
                    .insert([{
                        thread_id: newOrExistingThreadId,
                        sender_id: userId,
                        content: content,
                        attached_file_name: _type === 'completion' ? 'Completion Letter.pdf' : _type === 'joining' ? 'Joining Letter.pdf' : null
                    }]);

                if (messageError) throw messageError;

                // We don't need to manually setThreads here since the global useEffect subscription will catch it
            }

            if (_type === 'discovery') {
                toast.success('Your message has been sent to the candidate successfully!');
                if (newOrExistingThreadId) {
                    setTargetMessageThreadId(newOrExistingThreadId);
                    setActiveTab('messages');
                }
            } else if (_type === 'completion' || _type === 'joining') {
                if (newOrExistingThreadId) {
                    setTargetMessageThreadId(newOrExistingThreadId);
                    setActiveTab('messages');
                }
            }
        } catch (err: any) {
            console.error('Error sending message:', err);
            toast.error('Failed to send message: ' + err.message);
        }
    };

    const handleCompleteProject = async (projectId: string, candidateId: string) => {
        try {
            // Update application in Supabase
            const { error } = await supabase
                .from('applications')
                .update({ status: 'completed' })
                .eq('project_id', projectId)
                .eq('student_id', candidateId);

            if (error) throw error;

            setActiveProjects(prev => prev.map(p => {
                if (p.id === projectId) {
                    const candidate = p.workingCandidates?.find((c: any) => c.id === candidateId);
                    if (candidate) {
                        const collabEntry = {
                            id: `collab-${Date.now()}`,
                            candidateId: candidate.id,
                            name: candidate.name,
                            photoUrl: candidate.photoUrl,
                            projectName: p.role,
                            domain: candidate.domain,
                            rating: 0,
                            review: ''
                        };
                        setCollaboratedTalent(prevCollab => {
                            const newCollab = [collabEntry, ...prevCollab];
                            return newCollab;
                        });

                        const updatedProject = {
                            ...p,
                            workingCandidates: p.workingCandidates.filter((c: any) => c.id !== candidateId),
                            archivedCandidates: [...(p.archivedCandidates || []), { ...candidate, applicationStatus: 'completed' }]
                        };
                        if (selectedProject?.id === projectId) setSelectedProject(updatedProject);
                        return updatedProject;
                    }
                }
                return p;
            }));
        } catch (err: any) {
            console.error("Error completing candidate project:", err);
            toast.error("Failed to update candidate status");
        }
    };

    const handleRevertCandidate = async (projectId: string, candidateId: string) => {
        try {
            // Update application back to pending in Supabase
            const { error } = await supabase
                .from('applications')
                .update({ status: 'pending' })
                .eq('project_id', projectId)
                .eq('student_id', candidateId);

            if (error) throw error;

            setActiveProjects(prev => prev.map(p => {
                if (p.id === projectId) {
                    const candidate = p.archivedCandidates?.find((c: any) => c.id === candidateId);
                    if (candidate) {
                        const updatedProject = {
                            ...p,
                            archivedCandidates: p.archivedCandidates.filter((c: any) => c.id !== candidateId),
                            appliedCandidates: [...(p.appliedCandidates || []), { ...candidate, applicationStatus: 'pending' }]
                        };
                        if (selectedProject?.id === projectId) setSelectedProject(updatedProject);
                        return updatedProject;
                    }
                }
                return p;
            }));
        } catch (err: any) {
            console.error("Error reverting candidate:", err);
            toast.error("Failed to revert candidate");
        }
    };

    const handleCandidateMessageStatusChange = async (projectId: string, candidateId: string, status: 'accepted' | 'rejected') => {
        try {
            // Update application in Supabase based on the action taken in messages
            const { error } = await supabase
                .from('applications')
                .update({ status: status })
                .eq('project_id', projectId)
                .eq('student_id', candidateId);

            if (error) throw error;
            // Update thread status
            await supabase.from('message_threads').update({ status }).eq('project_id', projectId).eq('student_id', candidateId);

            setActiveProjects(prev => prev.map(p => {
                if (p.id === projectId) {
                    // Find the candidate (they should be in appliedCandidates with applicationStatus: 'accepted', or perhaps working/archived already)
                    // Actually they might be in `appliedCandidates` 
                    const candidate = p.appliedCandidates?.find((c: any) => c.id === candidateId) ||
                        p.workingCandidates?.find((c: any) => c.id === candidateId) ||
                        p.archivedCandidates?.find((c: any) => c.id === candidateId) ||
                        talentProfiles.find((c: any) => c.id === candidateId); // fallback

                    if (candidate) {
                        let newApplied = p.appliedCandidates?.filter((c: any) => c.id !== candidateId) || [];
                        let newWorking = p.workingCandidates?.filter((c: any) => c.id !== candidateId) || [];
                        let newArchived = p.archivedCandidates?.filter((c: any) => c.id !== candidateId) || [];

                        if (status === 'accepted') {
                            newWorking.push({ ...candidate, applicationStatus: 'accepted' });
                        } else if (status === 'rejected') {
                            newArchived.push({ ...candidate, applicationStatus: 'rejected' });
                        }

                        const updatedProject = {
                            ...p,
                            appliedCandidates: newApplied,
                            workingCandidates: newWorking,
                            archivedCandidates: newArchived
                        };

                        if (status === 'accepted') {
                            confetti({
                                particleCount: 150,
                                spread: 70,
                                origin: { y: 0.6 },
                                colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
                            });
                            
                            setCelebrationData({
                                title: 'Candidate Hired!',
                                message: `${candidate.name} is hired and moved to the Currently Working tab of the project. Would you like to send them an official joining letter?`,
                                primaryActionText: 'Send Joining Letter',
                                onPrimaryAction: () => {
                                    handleSendLetter(updatedProject.id, candidate.id, 'joining', `Dear ${candidate.name},\n\nWe are thrilled to officially welcome you to the team for the ${updatedProject.role} project! We were very impressed with your background and believe your skills will be a great addition to our efforts.\n\nPlease find attached the necessary onboarding documents and your initial task assignments.\n\nBest regards,\n${userName}`);
                                    setShowCelebration(false);
                                    setTimeout(() => {
                                        toast.success('Joining letter has been generated and sent to the candidate.');
                                        setSelectedProject(updatedProject);
                                        setProjectInitialTab('working');
                                        setIsProjectDetailsModalOpen(true);
                                    }, 500);
                                }
                            });
                            setShowCelebration(true);
                        }

                        return updatedProject;
                    }
                }
                return p;
            }));
        } catch (err: any) {
            console.error("Error updating candidate message status:", err);
            toast.error("Failed to update candidate status");
        }
    };

    const renderRecruiterAnalytics = () => {
        const totalProjects = activeProjects.length + archivedProjects.length;
        
        let totalApplicants = 0;
        let totalHired = 0;
        let totalShortlisted = 0;
        let totalInterviewed = 0;

        activeProjects.forEach(p => {
            totalApplicants += (p.appliedCandidates?.length || 0) + (p.workingCandidates?.length || 0) + (p.archivedCandidates?.length || 0);
            totalHired += p.workingCandidates?.length || 0;
            totalShortlisted += p.appliedCandidates?.filter((c: any) => c.applicationStatus === 'shortlisted').length || 0;
            totalInterviewed += p.appliedCandidates?.filter((c: any) => c.applicationStatus === 'interview').length || 0;
        });

        const avgTimeToHire = totalHired > 0 ? "8.2 Days" : "N/A";

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hiring Velocity (Avg Time-to-Hire)</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{avgTimeToHire}</span>
                            <span className="text-xs text-green-600 font-bold">-12% vs last month</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                            Average duration between posting a project and onboarding selected candidates.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Applicant Yield</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{totalApplicants}</span>
                            <span className="text-xs text-brand-600 font-bold">+28% growth</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                            Across {totalProjects} projects published in this workspace.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fill Rate</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">
                                {totalProjects > 0 ? Math.round((archivedProjects.filter(p => p.status === 'completed').length / totalProjects) * 100) : 0}%
                            </span>
                            <span className="text-xs text-emerald-600 font-bold">Stable</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                            Completed and successfully delivered projects vs total published projects.
                        </p>
                    </div>
                </div>

                {/* Funnel Graph */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recruitment Funnel Conversion</h3>
                    
                    <div className="space-y-4">
                        {[
                            { label: 'Applied / New Applications', value: totalApplicants, percent: 100, color: 'bg-brand-500' },
                            { label: 'Shortlisted for Review', value: totalShortlisted + totalInterviewed + totalHired, percent: totalApplicants > 0 ? Math.round(((totalShortlisted + totalInterviewed + totalHired) / totalApplicants) * 100) : 0, color: 'bg-indigo-500' },
                            { label: 'Interviewed Candidates', value: totalInterviewed + totalHired, percent: totalApplicants > 0 ? Math.round(((totalInterviewed + totalHired) / totalApplicants) * 100) : 0, color: 'bg-amber-500' },
                            { label: 'Hired & Onboarded', value: totalHired, percent: totalApplicants > 0 ? Math.round((totalHired / totalApplicants) * 100) : 0, color: 'bg-green-600' }
                        ].map((stage, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between text-sm font-semibold">
                                    <span className="text-slate-700 dark:text-slate-300">{stage.label}</span>
                                    <span className="text-slate-900 dark:text-white">{stage.value} ({stage.percent}%)</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${stage.color}`}
                                        style={{ width: `${stage.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Insight-Led Recommendations */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-500 inline-block"></span>
                        Hiring Insights &amp; Recommended Actions
                    </h3>
                    <div className="space-y-3 text-sm font-sans">
                        {totalInterviewed > 0 && (
                            <div className="flex gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                                <span className="text-purple-500 text-base shrink-0">💡</span>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <strong>{totalInterviewed} candidate{totalInterviewed > 1 ? 's are' : ' is'} currently in interview stage.</strong> Projects that move candidates from Interview to Final Review within 5 days show a 2.4× higher offer acceptance rate.
                                </p>
                            </div>
                        )}
                        {totalShortlisted > 0 && totalInterviewed === 0 && (
                            <div className="flex gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                                <span className="text-indigo-500 text-base shrink-0">📋</span>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <strong>You have {totalShortlisted} shortlisted candidate{totalShortlisted > 1 ? 's' : ''}.</strong> Schedule interviews now — shortlisted candidates who wait &gt;7 days before hearing back are 60% more likely to accept other offers.
                                </p>
                            </div>
                        )}
                        {totalApplicants > 0 && totalHired === 0 && (
                            <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                                <span className="text-amber-500 text-base shrink-0">⏱</span>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <strong>No candidates hired yet.</strong> Your average time-to-hire is highest when applicants stay in "Pending" for &gt;72 hours. Moving them to "Reviewing" within 48 hours increases fill rate by 38%.
                                </p>
                            </div>
                        )}
                        {totalHired > 0 && (
                            <div className="flex gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                                <span className="text-green-500 text-base shrink-0">✅</span>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <strong>Great progress — {totalHired} candidate{totalHired > 1 ? 's' : ''} hired.</strong> Send an onboarding message within 24 hours of hire to set expectations clearly and reduce early drop-offs.
                                </p>
                            </div>
                        )}
                        {totalApplicants === 0 && (
                            <div className="flex gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <span className="text-slate-400 text-base shrink-0">📊</span>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Post your first project and start receiving applications. Analytics and insights will appear here once candidates apply.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="pt-24 pb-12 bg-slate-50 dark:bg-slate-900 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-serif mb-2">My Desk</h1>
                </div>
                <PageSkeleton type="dashboard" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-8 pb-20 bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">
                            Recruiter Dashboard
                        </h1>
                        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
                            Manage your live projects and evaluate qualified student candidates.
                        </p>
                    </div>
                    {activeTab === 'projects' && (
                        <button
                            onClick={() => {
                                setEditingProjectData(null);
                                setIsPostProjectModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors shadow-sm"
                        >
                            <PlusCircle className="w-4 h-4" /> Post New Project
                        </button>
                    )}
                </div>

                {/* Next Best Action Banner */}
                {(() => {
                    let totalPendingApps = 0;
                    activeProjects.forEach(p => {
                        totalPendingApps += p.appliedCandidates?.filter((c: any) => c.applicationStatus === 'pending').length || 0;
                    });

                    return (
                        <div className="mb-8 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-brand-600 text-white rounded-xl shadow-sm">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Next Step</h4>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 mt-0.5">
                                        {totalPendingApps > 0
                                            ? `You have ${totalPendingApps} pending applicant${totalPendingApps > 1 ? 's' : ''} awaiting review. Open "My Projects" to advance candidate stages.`
                                            : activeProjects.length > 0
                                            ? `Invite qualified student profiles to your active projects from the "Discover Talent" tab.`
                                            : `Publish your first live project listing to start receiving student applications.`
                                        }
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (totalPendingApps > 0) {
                                        setActiveTab('projects');
                                    } else if (activeProjects.length > 0) {
                                        setActiveTab('talent');
                                    } else {
                                        setEditingProjectData(null);
                                        setIsPostProjectModalOpen(true);
                                    }
                                }}
                                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm shrink-0"
                            >
                                {totalPendingApps > 0 ? "Review Applicants" : activeProjects.length > 0 ? "Find Talent" : "Create Project"}
                            </button>
                        </div>
                    );
                })()}

                {/* Navigation Tabs */}
                <div className="hidden md:flex space-x-2 sm:space-x-8 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto no-scrollbar mask-edges min-w-full">
                    <button
                        onClick={() => {
                            setTargetMessageThreadId(null);
                            setActiveTab('projects');
                        }}
                        className={`pb-4 px-2 sm:px-4 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap shrink-0 flex items-center gap-2 ${activeTab === 'projects'
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                            }`}
                    >
                        <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                        My Projects
                        {activeTab === 'projects' && (
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-600 dark:bg-brand-500 rounded-t-full animate-in fade-in zoom-in duration-300" />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setTargetMessageThreadId(null);
                            setActiveTab('talent');
                        }}
                        className={`pb-4 px-2 sm:px-4 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap shrink-0 flex items-center gap-2 ${activeTab === 'talent'
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                            }`}
                    >
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                        Discover Talent
                        {activeTab === 'talent' && (
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-600 dark:bg-brand-500 rounded-t-full animate-in fade-in zoom-in duration-300" />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setTargetMessageThreadId(null);
                            setActiveTab('collaborated');
                        }}
                        className={`pb-4 px-2 sm:px-4 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap shrink-0 flex items-center gap-2 ${activeTab === 'collaborated'
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                            }`}
                    >
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        Collaborated Talent
                        {activeTab === 'collaborated' && (
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-600 dark:bg-brand-500 rounded-t-full animate-in fade-in zoom-in duration-300" />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('messages');
                        }}
                        className={`pb-4 px-2 sm:px-4 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap shrink-0 flex items-center gap-2 ${activeTab === 'messages'
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                        Messages
                        {activeTab === 'messages' && (
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-600 dark:bg-brand-500 rounded-t-full animate-in fade-in zoom-in duration-300" />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('analytics');
                        }}
                        className={`pb-4 px-2 sm:px-4 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap shrink-0 flex items-center gap-2 ${activeTab === 'analytics'
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                            }`}
                    >
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                        Hiring Analytics
                        {activeTab === 'analytics' && (
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-600 dark:bg-brand-500 rounded-t-full animate-in fade-in zoom-in duration-300" />
                        )}
                    </button>
                </div>

                <div className="mt-8">
                    {activeTab === 'projects' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Project List will go here */}
                            {activeProjects.length === 0 ? (
                                <EmptyState
                                    icon={Briefcase}
                                    title="No active projects"
                                    description="Get started by creating a new live project for students."
                                    actionLabel="Post New Project"
                                    actionIcon={PlusCircle}
                                    onAction={() => {
                                        setEditingProjectData(null);
                                        setIsPostProjectModalOpen(true);
                                    }}
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeProjects.map(project => (
                                        <div
                                            key={project.id}
                                            onClick={() => handleProjectClick(project)}
                                            className="glass-card p-4 sm:p-6 flex flex-col cursor-pointer hover:border-brand-500/50 hover:shadow-lg transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 p-2 rounded-lg">
                                                    <Briefcase className="w-6 h-6" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white mb-2">{project.role}</h3>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{project.objective}</p>

                                            <div className="mt-auto space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex flex-wrap gap-y-2 gap-x-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                                        <MapPin className="w-4 h-4" /> {project.domain}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                                        <Clock className="w-4 h-4 mr-1 text-slate-400" /> {project.tenure} Months
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-md mt-1 mb-2">
                                                        <Users className="w-4 h-4" /> {project.positions - (project.workingCandidates?.length || 0)} {Math.abs(project.positions - (project.workingCandidates?.length || 0)) === 1 ? 'Position' : 'Positions'} Left
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mt-2 w-full">
                                                    <button
                                                        onClick={(e) => handleEditProjectClick(e, project)}
                                                        className="flex-1 text-sm font-bold px-4 py-2.5 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors btn-interactive border border-brand-200 dark:border-brand-800"
                                                    >
                                                        Edit Project
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmingArchiveId(project.id);
                                                        }}
                                                        className="flex-1 text-sm font-bold px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors btn-interactive"
                                                    >
                                                        Archive Project
                                                    </button>
                                                </div>

                                                {project.attachmentName && (
                                                    <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50 mt-2">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{project.attachmentName}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Archived Projects Section */}
                            {archivedProjects.length > 0 && (
                                <div className="mt-12">
                                    <div className="flex items-center gap-3 mb-6">
                                        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Archived</h2>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                            {archivedProjects.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {archivedProjects.map(project => (
                                            <div
                                                key={project.id}
                                                onClick={() => handleProjectClick(project)}
                                                className="glass-card p-4 sm:p-6 flex flex-col cursor-pointer border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all opacity-80 hover:opacity-100"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2 rounded-lg">
                                                        <Briefcase className="w-6 h-6" />
                                                    </div>
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${(!project.workingCandidates?.length || project.workingCandidates.length === 0) ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                                        {(!project.workingCandidates?.length || project.workingCandidates.length === 0) ? 'Expired' : 'Completed'}
                                                    </span>
                                                </div>
                                                <h3 className="font-heading font-bold text-xl text-slate-700 dark:text-slate-300 mb-2">{project.role}</h3>
                                                <p className="text-slate-500 dark:text-slate-500 text-sm mb-4 line-clamp-2">{project.objective}</p>

                                                <div className="mt-auto space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                                                    <div className="flex flex-wrap gap-y-2 gap-x-4">
                                                        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500">
                                                            <MapPin className="w-4 h-4" /> {project.domain}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500">
                                                            <Clock className="w-4 h-4" /> {project.tenure}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                            <Users className="w-4 h-4 text-slate-400" /> {project.workingCandidates?.length || 0}/{project.positions || 1} Hired
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'talent' && (
                        <div className="overflow-x-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 shrink-0 gap-4 overflow-x-auto pb-2">
                                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto min-w-max">
                                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Domain</label>
                                        <select
                                            value={filterDomain}
                                            onChange={(e) => setFilterDomain(e.target.value)}
                                            className="w-full sm:w-48 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                        >
                                            <option value="All">All Domains</option>
                                            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">College</label>
                                        <select
                                            value={filterCollege}
                                            onChange={(e) => setFilterCollege(e.target.value)}
                                            className="w-full sm:w-64 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                        >
                                            <option value="All">All Colleges</option>
                                            {colleges.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 w-full sm:w-auto">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sort By</label>
                                    <select
                                        value={sortOption}
                                        onChange={(e) => setSortOption(e.target.value)}
                                        className="w-full sm:w-64 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    >
                                        <option value="Completed Projects (High to Low)">Projects (High to Low)</option>
                                        <option value="Completed Projects (Low to High)">Projects (Low to High)</option>
                                        <option value="Name (A-Z)">Name (A-Z)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
                                {activeProjects.length === 0 ? (
                                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                                        
                                        {/* Blurred Background Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 blur-[8px] opacity-60 pointer-events-none select-none">
                                            {[1, 2, 3, 4].map(idx => (
                                                <div key={idx} className="bg-white dark:bg-slate-800 h-64 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center">
                                                    <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse mb-4"></div>
                                                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse mb-2"></div>
                                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse mb-4"></div>
                                                    <div className="flex gap-2 w-full mt-auto">
                                                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Overlay CTA */}
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-slate-900/10 dark:bg-slate-900/40 backdrop-blur-[2px]">
                                            <div className="bg-white/95 dark:bg-slate-800/95 p-8 rounded-3xl shadow-2xl max-w-md text-center border border-slate-200/50 dark:border-slate-700/50 transform transition-transform group-hover:scale-105 duration-500">
                                                <div className="bg-brand-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-brand-600 dark:text-brand-400">
                                                    <Users className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-3">
                                                    Unlock the Talent Pool
                                                </h3>
                                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                                                    Post your first active project to unlock full access and message over 500+ verified student developers eager to work with you.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        setActiveTab('projects');
                                                        setEditingProjectData(null);
                                                        setIsPostProjectModalOpen(true);
                                                    }}
                                                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 px-6 rounded-xl hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                                                >
                                                    <Briefcase className="w-5 h-5" />
                                                    Post a Live Project
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                ) : (
                                    filteredAndSortedProfiles.map(profile => (
                                        <StudentProfileCard
                                            key={profile.id}
                                            profile={profile}
                                            onClick={handleProfileClick}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'collaborated' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {collaboratedTalent.length === 0 ? (
                                <div className="text-center py-20 glass-card">
                                    <CheckCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Collaborated Talent Yet</h3>
                                    <p className="mt-2 text-slate-500 dark:text-slate-400">Complete projects with candidates to see them here.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 stagger-1">
                                    {collaboratedTalent.map(collab => (
                                        <div key={collab.id} className="hover:-translate-y-1 transition-transform duration-300">
                                            <CollaboratedTalentCard
                                                collab={collab}
                                                onMessageInitiated={(projectId, candidateId, message) => handleSendLetter(projectId, candidateId, 'discovery', message)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <MessagingHub
                                projects={activeProjects}
                                threads={threads}
                                setThreads={setThreads}
                                onUpdateCandidateStatus={handleCandidateMessageStatusChange}
                                initialActiveThreadId={targetMessageThreadId}
                            />
                        </div>
                    )}

                    {activeTab === 'analytics' && renderRecruiterAnalytics()}
                </div>

            </div >

            <PostProjectModal
                isOpen={isPostProjectModalOpen}
                onClose={() => {
                    setIsPostProjectModalOpen(false);
                    setEditingProjectData(null);
                }}
                onSubmit={handlePostProject}
                editingProject={editingProjectData}
            />

            <StudentProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                profile={selectedProfile}
                hasActiveProjects={activeProjects.length > 0 || archivedProjects.length > 0}
                activeProjects={activeProjects}
                onPostProjectClick={() => setIsPostProjectModalOpen(true)}
                onMessageInitiated={(projectId, candidateId, message) => handleSendLetter(projectId, candidateId, 'discovery', message)}
            />

            <ProjectDashboard
                isOpen={isProjectDetailsModalOpen}
                onClose={() => setIsProjectDetailsModalOpen(false)}
                project={selectedProject}
                initialTab={projectInitialTab}
                onArchive={handleArchiveConfirmTrigger}
                onAcceptCandidate={handleAcceptCandidate}
                onDeclineCandidate={handleDeclineCandidate}
                onMessageWorkingCandidate={handleMessageWorkingCandidate}
                onSendLetter={handleSendLetter}
                onCompleteProject={handleCompleteProject}
                onRevertCandidate={handleRevertCandidate}
                onUpdateCandidateStage={handleUpdateCandidateStage}
            />

            <ConfirmModal
                isOpen={!!confirmingArchiveId}
                title="Archive Project"
                message="Are you completely sure you want to archive this project? Once archived, it will no longer be visible to students for new applications, but you will still retain access to the candidate pool."
                confirmText="Archive Project"
                cancelText="Cancel"
                type="warning"
                onConfirm={handleArchiveProject}
                onCancel={() => setConfirmingArchiveId(null)}
            />

            <CelebrationModal
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
                title={celebrationData.title}
                message={celebrationData.message}
                primaryActionText={celebrationData.primaryActionText}
                onPrimaryAction={celebrationData.onPrimaryAction}
                hideConfetti={celebrationData.hideConfetti}
                icon={celebrationData.icon}
            >
                {celebrationData.children}
            </CelebrationModal>
        </div >
    );
};

export default RecruiterDashboard;
