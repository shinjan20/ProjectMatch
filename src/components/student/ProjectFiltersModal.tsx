import { X, Filter, SlidersHorizontal, MapPin, Clock, Banknote } from 'lucide-react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

interface ProjectFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Current filter states
    filters: {
        duration: string[];
        stipend: string;
        skills: string[];
        workType: string[];
        showBookmarkedOnly: boolean;
        difficulty: string;
        weeklyCommitment: string;
        deadline: string;
    };
    onFiltersChange: (newFilters: any) => void;
}

const AVAILABLE_SKILLS = [
    'React', 'Node.js', 'Python', 'TypeScript', 'Figma', 'AWS', 'TensorFlow', 'UI/UX', 'SEO'
];

const WORK_TYPES = ['WFH', 'WFO', 'Hybrid'];
const DURATIONS = ['1 month', '2 months', '3 months', '6 months'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const COMMITMENTS = ['< 10 hrs/week', '10-20 hrs/week', '20+ hrs/week'];
const DEADLINES = ['Closing soon (7 days)', 'Closing soon (30 days)'];

export default function ProjectFiltersModal({ isOpen, onClose, filters, onFiltersChange }: ProjectFiltersModalProps) {
    // Add escape to close shortcut
    useKeyboardShortcut('Escape', onClose, { enabled: isOpen });

    if (!isOpen) return null;

    const toggleDuration = (duration: string) => {
        const newDurs = filters.duration.includes(duration)
            ? filters.duration.filter(d => d !== duration)
            : [...filters.duration, duration];
        onFiltersChange({ ...filters, duration: newDurs });
    };

    const toggleWorkType = (type: string) => {
        const newTypes = filters.workType.includes(type)
            ? filters.workType.filter(t => t !== type)
            : [...filters.workType, type];
        onFiltersChange({ ...filters, workType: newTypes });
    };

    const toggleSkill = (skill: string) => {
        const newSkills = filters.skills.includes(skill)
            ? filters.skills.filter(s => s !== skill)
            : [...filters.skills, skill];
        onFiltersChange({ ...filters, skills: newSkills });
    };

    const clearFilters = () => {
        onFiltersChange({
            duration: [],
            stipend: '',
            skills: [],
            workType: [],
            showBookmarkedOnly: false,
            difficulty: '',
            weeklyCommitment: '',
            deadline: ''
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal / Bottom Sheet Dialog */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-[2rem] rounded-b-none sm:rounded-b-[2rem] shadow-2xl shadow-brand-500/10 border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                
                {/* Mobile Drag Handle */}
                <div className="w-full flex justify-center pt-3 pb-1 sm:hidden" onClick={onClose}>
                    <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>

                {/* Header */}
                <div className="px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-50 dark:bg-brand-500/10 p-2 rounded-xl">
                            <Filter className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                            Filter Projects
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto hide-scrollbar space-y-8 flex-1">

                    {/* Bookmarks Toggle (Unique filter feature) */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Bookmarked Projects Only</h3>
                            <p className="text-xs text-slate-500 mt-1">Show only projects you've saved</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={filters.showBookmarkedOnly}
                                onChange={(e) => onFiltersChange({ ...filters, showBookmarkedOnly: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
                        </label>
                    </div>

                    {/* Work Type */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center mb-3">
                            <MapPin className="w-4 h-4 mr-2 text-slate-400" /> Work Location
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {WORK_TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleWorkType(type)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filters.workType.includes(type)
                                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 border border-transparent'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500/50'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center mb-3">
                            <Clock className="w-4 h-4 mr-2 text-slate-400" /> Project Duration
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {DURATIONS.map(dur => (
                                <button
                                    key={dur}
                                    onClick={() => toggleDuration(dur)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filters.duration.includes(dur)
                                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 border border-transparent'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500/50'
                                        }`}
                                >
                                    {dur}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stipend Range */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center mb-3">
                            <Banknote className="w-4 h-4 mr-2 text-slate-400" /> Minimum Stipend (₹/month)
                        </h3>
                        <input
                            type="range"
                            min="0"
                            max="50000"
                            step="5000"
                            value={filters.stipend || '0'}
                            onChange={(e) => onFiltersChange({ ...filters, stipend: e.target.value })}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            <span>₹0 (Unpaid)</span>
                            <span className="text-brand-600 dark:text-brand-400 font-bold">
                                {filters.stipend ? `₹${filters.stipend}+` : 'Any'}
                            </span>
                            <span>₹50,000+</span>
                        </div>
                    </div>

                    {/* Skills Required */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center mb-3">
                            <SlidersHorizontal className="w-4 h-4 mr-2 text-slate-400" /> Skills & Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_SKILLS.map(skill => (
                                <button
                                    key={skill}
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filters.skills.includes(skill)
                                            ? 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-500/30'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center mb-3">
                            <SlidersHorizontal className="w-4 h-4 mr-2 text-slate-400" /> Difficulty Level
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {DIFFICULTIES.map(diff => (
                                <button
                                    key={diff}
                                    onClick={() => onFiltersChange({ ...filters, difficulty: filters.difficulty === diff ? '' : diff })}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filters.difficulty === diff
                                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 border border-transparent'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500/50'
                                        }`}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Weekly Commitment */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center mb-3">
                            <Clock className="w-4 h-4 mr-2 text-slate-400" /> Weekly Commitment
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {COMMITMENTS.map(comm => (
                                <button
                                    key={comm}
                                    onClick={() => onFiltersChange({ ...filters, weeklyCommitment: filters.weeklyCommitment === comm ? '' : comm })}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filters.weeklyCommitment === comm
                                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 border border-transparent'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500/50'
                                        }`}
                                >
                                    {comm}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Application Deadline */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center mb-3">
                            <Clock className="w-4 h-4 mr-2 text-slate-400" /> Application Deadline
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {DEADLINES.map(dead => (
                                <button
                                    key={dead}
                                    onClick={() => onFiltersChange({ ...filters, deadline: filters.deadline === dead ? '' : dead })}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filters.deadline === dead
                                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 border border-transparent'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500/50'
                                        }`}
                                >
                                    {dead}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between rounded-b-[2rem]">
                    <button
                        onClick={clearFilters}
                        className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium transition-colors"
                    >
                        Clear all
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all active:scale-95"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
