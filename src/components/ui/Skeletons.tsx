
export const ProjectCardSkeleton = () => (
    <div className="glass-card p-5 animate-pulse border border-slate-200/50 dark:border-slate-800/50 rounded-2xl w-full">
        <div className="flex justify-between items-start mb-4">
            <div className="space-y-3 flex-1 mr-4">
                <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded-md w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded-md w-1/2"></div>
            </div>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700/50 rounded-xl shrink-0"></div>
        </div>
        <div className="flex gap-2 mb-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700/50 rounded-full w-20"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700/50 rounded-full w-24"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700/50 rounded-full w-16"></div>
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700/50 rounded-xl w-full mt-4"></div>
    </div>
);

export const CandidateRowSkeleton = () => (
    <div className="flex items-center gap-4 p-4 animate-pulse border-b border-slate-100 dark:border-slate-800">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700/50 rounded-full shrink-0"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded-md w-1/3"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded-md w-1/2"></div>
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700/50 rounded-lg w-20 shrink-0"></div>
    </div>
);

export const MessageThreadSkeleton = () => (
    <div className="flex flex-col gap-4 p-4 animate-pulse w-full">
        <div className="flex items-start gap-3 w-3/4">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700/50 rounded-full shrink-0"></div>
            <div className="h-16 bg-slate-200 dark:bg-slate-700/50 rounded-2xl rounded-tl-sm w-full"></div>
        </div>
        <div className="flex items-start gap-3 w-3/4 self-end flex-row-reverse">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700/50 rounded-full shrink-0"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700/50 rounded-2xl rounded-tr-sm w-full"></div>
        </div>
        <div className="flex items-start gap-3 w-2/3">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700/50 rounded-full shrink-0"></div>
            <div className="h-20 bg-slate-200 dark:bg-slate-700/50 rounded-2xl rounded-tl-sm w-full"></div>
        </div>
    </div>
);

export const DashboardFeedSkeleton = () => (
    <div className="space-y-4 w-full">
        <div className="h-8 bg-slate-200 dark:bg-slate-700/50 rounded-md w-1/3 mb-6"></div>
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
    </div>
);
