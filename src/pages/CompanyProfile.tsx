import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    Building2, 
    Globe, 
    Briefcase, 
    CheckCircle, 
    ArrowLeft, 
    Clock, 
    Users, 
    MessageSquare,
    TrendingUp
} from 'lucide-react';

export default function CompanyProfile() {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState<any>(null);
    const [activeProjects, setActiveProjects] = useState<any[]>([]);
    const [completedProjects, setCompletedProjects] = useState<any[]>([]);
    const [stats, setStats] = useState({
        responseRate: 100,
        totalApplications: 0,
        totalHires: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCompanyDetails = async () => {
            if (!companyId) return;
            setIsLoading(true);
            
            try {
                // 1. Fetch Profile info
                const { data: profileData, error: profileErr } = await supabase
                    .from('profiles')
                    .select('id, name, company_name, company_website, bio')
                    .eq('id', companyId)
                    .single();
                
                if (profileErr) throw profileErr;
                setProfile(profileData);

                // 2. Fetch Active Projects
                const { data: activeData } = await supabase
                    .from('projects')
                    .select('id, role, domain, tenure, remuneration, created_at, positions')
                    .eq('recruiter_id', companyId)
                    .eq('status', 'active');
                
                setActiveProjects(activeData || []);

                // 3. Fetch Completed Projects
                const { data: completedData } = await supabase
                    .from('projects')
                    .select('id, role, domain, tenure, remuneration, created_at, positions')
                    .eq('recruiter_id', companyId)
                    .eq('status', 'completed');
                
                setCompletedProjects(completedData || []);

                // 4. Fetch Applications to calculate metrics
                const { data: appsData } = await supabase
                    .from('applications')
                    .select(`
                        id,
                        status,
                        project_id,
                        project:projects!inner(recruiter_id)
                    `)
                    .eq('project.recruiter_id', companyId);

                const totalApps = appsData?.length || 0;
                const processedApps = appsData?.filter(a => a.status !== 'pending' && a.status !== 'reviewing').length || 0;
                const totalHired = appsData?.filter(a => a.status === 'accepted' || a.status === 'completed').length || 0;
                const rate = totalApps > 0 ? Math.round((processedApps / totalApps) * 100) : 95;

                setStats({
                    responseRate: rate,
                    totalApplications: totalApps,
                    totalHires: totalHired
                });

            } catch (err) {
                console.error("Error loading company profile:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanyDetails();
    }, [companyId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#030712]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#030712] p-4 text-center">
                <Building2 className="w-16 h-16 text-slate-350 dark:text-slate-600 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Company profile not found</h2>
                <p className="text-slate-500 max-w-sm mb-6">The recruiter or company configuration could not be loaded from the database.</p>
                <button
                    onClick={() => navigate('/projects')}
                    className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-500 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to projects
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20 bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Back Button */}
                <button 
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white text-sm font-bold mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {/* Profile Header Block */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                        
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-md shadow-brand-500/10">
                                {profile.company_name?.charAt(0) || 'C'}
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
                                    {profile.company_name || 'Acme Corporation'}
                                </h1>
                                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4 text-slate-400" /> Recruiter: {profile.name}
                                    </span>
                                    {profile.company_website && (
                                        <a 
                                            href={profile.company_website} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 hover:underline"
                                        >
                                            <Globe className="w-4 h-4" /> {profile.company_website.replace(/^https?:\/\//, '')}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Highlights */}
                        <div className="flex flex-wrap gap-3">
                            <span className="inline-flex px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider">
                                Verified Employer
                            </span>
                            <span className="inline-flex px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20 text-xs font-bold uppercase tracking-wider">
                                Active Hiring
                            </span>
                        </div>
                    </div>

                    {profile.bio && (
                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">About the Company</h3>
                            <p className="text-slate-650 dark:text-slate-350 text-base leading-relaxed max-w-3xl">
                                {profile.bio}
                            </p>
                        </div>
                    )}
                </div>

                {/* Grid Analytics Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Response Rate</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.responseRate}%</p>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Applicants</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.totalApplications}</p>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Hires Made</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.totalHires}</p>
                        </div>
                    </div>
                </div>

                {/* Active Projects Feed */}
                <div className="mb-12">
                    <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <Briefcase className="w-6 h-6 text-brand-600" /> Active Opportunities ({activeProjects.length})
                    </h2>
                    {activeProjects.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {activeProjects.map(proj => (
                                <div 
                                    key={proj.id}
                                    onClick={() => navigate('/projects')}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 hover:border-brand-500/50 cursor-pointer shadow-sm transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <span className="inline-block px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                            {proj.domain}
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-3 mb-2">
                                            {proj.role}
                                        </h3>
                                        <div className="flex gap-4 text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" /> {proj.tenure} months
                                            </span>
                                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                                ₹{proj.remuneration === '0' || Number(proj.remuneration) === 0 ? 'Unpaid' : `₹${proj.remuneration}/mo`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                            <p className="text-slate-500 text-sm">No active opportunities listed currently.</p>
                        </div>
                    )}
                </div>

                {/* Completed Projects History */}
                <div>
                    <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" /> Completed Project History ({completedProjects.length})
                    </h2>
                    {completedProjects.length > 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Project Role</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Domain</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Duration</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Hires</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                                    {completedProjects.map(proj => (
                                        <tr key={proj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{proj.role}</td>
                                            <td className="px-6 py-4 text-sm text-slate-650 dark:text-slate-350">{proj.domain}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{proj.tenure} months</td>
                                            <td className="px-6 py-4 text-sm font-medium text-green-600">Completed</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                            <p className="text-slate-500 text-sm">No completed project records found in database history.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
