interface PageSkeletonProps {
    type?: 'dashboard' | 'grid' | 'list';
}

export default function PageSkeleton({ type = 'dashboard' }: PageSkeletonProps) {
    if (type === 'grid') {
        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse mt-8">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="glass-card p-4 sm:p-6 flex flex-col">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-full mb-5" />
                        <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg mb-3" />
                        <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded mb-6" />
                        <div className="h-24 bg-slate-100 dark:bg-slate-800/40 rounded-xl mb-6" />
                        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl mt-auto" />
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'list') {
        return (
            <div className="space-y-4 animate-pulse mt-4 w-full">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <div className="space-y-3 flex-1">
                            <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-1/4 bg-slate-100 dark:bg-slate-800/60 rounded" />
                        </div>
                        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    </div>
                ))}
            </div>
        );
    }

    // Default: Dashboard layout
    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            {/* Header skeleton */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2" />
                    <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-full hidden sm:block" />
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-24" />
                ))}
            </div>

            {/* Content skeleton */}
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}
