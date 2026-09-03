import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowRight, Clock, Banknote, User, Sparkles, AlertCircle, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    response: any;
    onActionClicked?: (id: string) => void;
}

export default function StructuredResponses({ response, onActionClicked }: Props) {
    if (!response) return null;

    if (response.error) {
        return (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3.5 sm:p-4 rounded-xl border border-red-200 dark:border-red-800/60 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-xs text-red-800 dark:text-red-300">Search error</p>
                    <p className="text-xs mt-0.5">{response.error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full">
            {response.message && (
                <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    <p>{response.message}</p>
                </div>
            )}

            {response.response_type === 'project_search_result' && (
                <ProjectList entityIds={response.entity_ids || []} onActionClicked={onActionClicked} />
            )}

            {response.response_type === 'candidate_search_result' && (
                <CandidateList entityIds={response.entity_ids || []} onActionClicked={onActionClicked} />
            )}

            {response.insight && (
                <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200/70 dark:border-brand-900/40 text-sm">
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-brand-900 dark:text-brand-300 text-xs uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                        <span>AI Recommendation</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                        {response.insight}
                    </p>
                </div>
            )}
        </div>
    );
}

function ProjectList({ entityIds, onActionClicked }: { entityIds: string[], onActionClicked?: (id: string) => void }) {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!entityIds.length) {
            setLoading(false);
            return;
        }

        const fetchProjects = async () => {
            const { data } = await supabase
                .from('projects')
                .select('*')
                .in('id', entityIds);
            
            if (data) {
                // Keep the order returned by AI (which is sorted by similarity)
                const orderedData = entityIds.map(id => data.find(p => p.id === id)).filter(Boolean);
                setProjects(orderedData);
            }
            setLoading(false);
        };
        fetchProjects();
    }, [entityIds]);

    if (loading) {
        return (
            <div className="space-y-3" role="status" aria-label="Loading projects">
                {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse border border-slate-200/50 dark:border-slate-800" />
                ))}
            </div>
        );
    }

    if (projects.length === 0) return null;

    return (
        <div className="space-y-3 w-full">
            {projects.map((project: any) => {
                const stipendText = project.remuneration === '0' || Number(project.remuneration) === 0 || !project.remuneration
                    ? 'Unpaid'
                    : `₹${Number(project.remuneration).toLocaleString()}/mo`;

                return (
                    <div 
                        key={project.id} 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-md border border-brand-200/50 dark:border-brand-800/40">
                                    {project.domain || project.category || 'General'}
                                </span>
                                {project.company && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <Building2 className="w-3 h-3" /> {project.company}
                                    </span>
                                )}
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-1">
                                {project.role || project.title}
                            </h4>
                            
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{project.tenure || project.duration || 'Flexible duration'}</span>
                                </div>
                                <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                    <Banknote className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>{stipendText}</span>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => {
                                if (onActionClicked) {
                                    onActionClicked(project.id);
                                } else {
                                    navigate('/projects');
                                }
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm"
                        >
                            View Project <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function CandidateList({ entityIds, onActionClicked }: { entityIds: string[], onActionClicked?: (id: string) => void }) {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!entityIds.length) {
            setLoading(false);
            return;
        }

        const fetchCandidates = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, name, role, college, domain, avatar_url, photo_url, skills')
                .in('id', entityIds);
            
            if (data) {
                const orderedData = entityIds.map(id => data.find(p => p.id === id)).filter(Boolean);
                setCandidates(orderedData);
            }
            setLoading(false);
        };
        fetchCandidates();
    }, [entityIds]);

    if (loading) {
        return (
            <div className="space-y-3" role="status" aria-label="Loading candidates">
                {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse border border-slate-200/50 dark:border-slate-800" />
                ))}
            </div>
        );
    }

    if (candidates.length === 0) return null;

    return (
        <div className="space-y-3 w-full">
            {candidates.map((candidate: any) => {
                const displayName = candidate.full_name || candidate.name || 'Anonymous Student';
                const avatar = candidate.avatar_url || candidate.photo_url;
                const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

                return (
                    <div 
                        key={candidate.id} 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold text-xs rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-brand-200 dark:border-brand-800">
                                {avatar ? (
                                    <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    initials || <User className="w-5 h-5" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                    {displayName}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {candidate.college || candidate.domain || candidate.role || 'Student Developer'}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => onActionClicked?.(candidate.id)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5"
                        >
                            Review Profile <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
