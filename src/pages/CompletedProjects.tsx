import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_PROJECTS } from '../constants';
import { CheckCircle2, FileText, Download, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function CompletedProjects() {
    const { userId, userRole } = useAuth();
    const navigate = useNavigate();
    const [downloadingLetter, setDownloadingLetter] = useState<{ projectId: number | string, type: 'Certificate' | 'Completion Letter' } | null>(null);
    const [dbProjects, setDbProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId || userRole !== 'student') return;

        const fetchCompletedProjects = async () => {
            try {
                const { data, error } = await supabase
                    .from('applications')
                    .select(`
                        id,
                        status,
                        project:projects (
                            id,
                            role,
                            domain,
                            tenure,
                            remuneration,
                            recruiter:profiles (
                                name,
                                company_name
                            )
                        )
                    `)
                    .eq('student_id', userId)
                    .eq('status', 'completed');

                if (error) throw error;

                if (data) {
                    const formatted = data.map((app: any) => {
                        const proj = app.project;
                        return {
                            id: proj.id,
                            title: proj.role,
                            company: proj.recruiter?.company_name || proj.recruiter?.name || 'Company',
                            duration: `${proj.tenure} Month${proj.tenure === 1 ? '' : 's'}`,
                            type: 'Remote',
                            category: proj.domain,
                            remuneration: String(proj.remuneration)
                        };
                    });
                    setDbProjects(formatted);
                }
            } catch (err) {
                console.error('Error fetching completed projects:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompletedProjects();
    }, [userId, userRole]);

    // Use database completed projects, with fallback to mock data for demonstration
    const completedProjects = dbProjects.length > 0 ? dbProjects : [MOCK_PROJECTS[4]];

    if (userRole !== 'student') {
        return (
            <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold">Unauthorized. Students only.</h2>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0b0f19]">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-brand-500 animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pt-32 pb-20 bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-300">
            {/* Clean Flat Background */}
            <div className="absolute inset-0 pointer-events-none z-0" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-brand-600" />
                            Completed Projects
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-base max-w-2xl">
                            Review your successful collaborations, showcase your experience, and download your verified certificates of completion.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/student')}
                        className="flex-shrink-0 text-sm font-medium px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 transition-colors shadow-sm"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {completedProjects.length === 0 ? (
                        <div className="py-20 px-6 bg-white dark:bg-slate-900 text-center flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                            <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl mb-6 flex items-center justify-center">
                                <GraduationCap className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No completed projects yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Finish your ongoing projects successfully to build your verified portfolio visible to recruiters here.</p>

                            <button
                                onClick={() => navigate('/projects')}
                                className="mt-8 px-6 py-3 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 text-brand-600 dark:text-brand-400 font-bold rounded-xl transition-all flex items-center gap-2"
                            >
                                Find New Projects
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">Project & Company</th>
                                            <th scope="col" className="px-6 py-4">Domain</th>
                                            <th scope="col" className="px-6 py-4">Duration</th>
                                            <th scope="col" className="px-6 py-4">Remuneration</th>
                                            <th scope="col" className="px-6 py-4 text-right">Documents</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                        {completedProjects.map(project => (
                                            <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white text-base">{project.title}</div>
                                                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{project.company}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        {project.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                                                    {project.duration} ({project.type})
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-bold">
                                                    {project.remuneration === '0' ? 'Experience Based' : `₹${project.remuneration}/month`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="inline-flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDownloadingLetter({ projectId: project.id, type: 'Completion Letter' });
                                                                setTimeout(() => setDownloadingLetter(null), 2000);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                                                        >
                                                            <FileText className="w-3.5 h-3.5 text-slate-400" /> Letter
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDownloadingLetter({ projectId: project.id, type: 'Certificate' });
                                                                setTimeout(() => setDownloadingLetter(null), 2000);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-lg border border-brand-200 dark:border-brand-800 transition-colors"
                                                        >
                                                            <Download className="w-3.5 h-3.5 text-brand-500" /> Certificate
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Download Popup */}
            {downloadingLetter && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
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
