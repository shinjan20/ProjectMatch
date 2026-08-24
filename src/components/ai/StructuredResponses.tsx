import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowRight, Clock, Banknote, User } from 'lucide-react';

interface Props {
    response: any;
    onActionClicked?: (id: string) => void;
}

export default function StructuredResponses({ response, onActionClicked }: Props) {
    if (!response) return null;

    if (response.error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-100 dark:border-red-900/30 text-sm">
                {response.error}
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full">
            {response.message && response.response_type !== 'explanation_result' && (
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {response.message}
                </p>
            )}

            {response.response_type === 'explanation_result' && (
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <p>{response.message}</p>
                </div>
            )}

            {response.response_type === 'project_search_result' && (
                <ProjectList entityIds={response.entity_ids || []} onActionClicked={onActionClicked} />
            )}

            {response.response_type === 'candidate_search_result' && (
                <CandidateList entityIds={response.entity_ids || []} />
            )}

            {response.insight && (
                <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">AI Assessment</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
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
        return <div className="animate-pulse space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}
        </div>;
    }

    if (projects.length === 0) return null;

    return (
        <div className="space-y-3 w-full">
            {projects.map((project: any) => (
                <div key={project.id} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-sm">
                                {project.domain}
                            </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{project.role}</h4>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {project.tenure} months
                            </div>
                            <div className="flex items-center">
                                <Banknote className="w-3.5 h-3.5 mr-1.5 shrink-0" /> ₹{project.remuneration?.toLocaleString() || 'Unpaid'}
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onActionClicked?.(project.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shrink-0"
                    >
                        Review <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            ))}
        </div>
    );
}

function CandidateList({ entityIds }: { entityIds: string[] }) {
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
                .select('*')
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
        return <div className="animate-pulse space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}
        </div>;
    }

    if (candidates.length === 0) return null;

    return (
        <div className="space-y-3 w-full">
            {candidates.map((candidate: any) => (
                <div key={candidate.id} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                        {candidate.avatar_url ? (
                            <img src={candidate.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-slate-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{candidate.full_name || 'Anonymous Candidate'}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{candidate.role || 'Student'}</p>
                    </div>
                    <button className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors shrink-0">
                        Review
                    </button>
                </div>
            ))}
        </div>
    );
}
