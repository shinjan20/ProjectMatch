import { useNavigate } from 'react-router-dom';
import { useNotifications, type NotificationItem } from '../hooks/useNotifications';
import { 
    Bell, 
    MessageSquare, 
    CheckCircle, 
    Clock, 
    Trash2, 
    CheckCheck,
    X
} from 'lucide-react';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const navigate = useNavigate();
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();

    if (!isOpen) return null;

    const handleItemClick = (item: NotificationItem) => {
        markAsRead(item.id);
        onClose();
        if (item.link) {
            navigate(item.link);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'message':
                return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'deadline':
                return <Clock className="w-4 h-4 text-amber-500" />;
            default:
                return <CheckCircle className="w-4 h-4 text-green-500" />;
        }
    };

    const formatTime = (isoString: string) => {
        const diff = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return new Date(isoString).toLocaleDateString();
    };

    return (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
                </div>
                <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                        <>
                            <button
                                onClick={markAllAsRead}
                                title="Mark all as read"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
                            >
                                <CheckCheck className="w-4 h-4" />
                            </button>
                            <button
                                onClick={clearAll}
                                title="Clear all notifications"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 hide-scrollbar">
                {notifications.length > 0 ? (
                    notifications.map(item => (
                        <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-850/40 cursor-pointer transition-colors relative ${
                                !item.read ? 'bg-brand-50/20 dark:bg-brand-500/5' : ''
                            }`}
                        >
                            {!item.read && (
                                <span className="absolute top-4 right-4 w-2 h-2 bg-brand-600 rounded-full" />
                            )}
                            <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                {getIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-xs text-slate-900 dark:text-white truncate ${
                                    !item.read ? 'font-bold' : 'font-semibold'
                                }`}>
                                    {item.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed break-words">
                                    {item.message}
                                </p>
                                <span className="text-[9px] text-slate-400 font-medium block mt-1.5">
                                    {formatTime(item.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 px-4 text-center">
                        <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-xs text-slate-500 font-medium">No new notifications</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/30 dark:bg-slate-900/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        End of Notifications Feed
                    </span>
                </div>
            )}
        </div>
    );
}
