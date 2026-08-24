import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowRight, Clock, Banknote, User, CheckCircle2 } from 'lucide-react';

interface Props {
    response: any;
    onActionClicked?: (id: string) => void;
}

export default function StructuredResponses({ response, onActionClicked }: Props) {
    if (!response) return null;

    if (response.error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 text-sm">
                {response.error}
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-slate-800 dark:text-slate-200">
                <p>{response.message}</p>
                {response.insight && (
                    <div className="mt-3 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3 flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                        <p>{response.insight}</p>
                    </div>
                )}
            </div>

            {response.response_type === 'project_search_result' && (
                <ProjectList entityIds={response.entity_ids || []} onActionClicked={onActionClicked} />
            )}

            {response.response_type === 'candidate_search_result' && (
                <CandidateList entityIds={response.entity_ids || []} />
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
                // Keep the order returned by AI
                const orderedData = entityIds.map(id => data.find(p => p.id === id)).filter(Boolean);
                setProjects(orderedData);
            }
            setLoading(false);
        };
        fetchProjects();
    }, [entityIds]);

    if (loading) {
        return <div className="animate-pulse space-y-3">
            {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>)}
        </div>;
    }

    if (projects.length === 0) return null;

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-2 px-2">
            {projects.map((project: any) => (
                <div key={project.id} className="min-w-[280px] max-w-[320px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col shadow-sm shrink-0">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{project.role}</h4>
                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-3 block">{project.domain}</span>
                    
                    <div className="space-y-2 mb-4 mt-auto">
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 mr-2 shrink-0" /> {project.tenure} months
                        </div>
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                            <Banknote className="w-3.5 h-3.5 mr-2 shrink-0" /> ₹{project.remuneration?.toLocaleString() || 'Unpaid'}
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onActionClicked?.(project.id)}
                        className="w-full py-2.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        View Project <ArrowRight className="w-3 h-3" />
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
            {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>)}
        </div>;
    }

    if (candidates.length === 0) return null;

    return (
        <div className="space-y-3">
            {candidates.map((candidate: any) => (
                <div key={candidate.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                        {candidate.avatar_url ? (
                            <img src={candidate.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-6 h-6 text-slate-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{candidate.full_name || 'Anonymous Candidate'}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{candidate.role || 'Student'}</p>
                    </div>
                    <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors">
                        View Profile
                    </button>
                </div>
            ))}
        </div>
    );
}
