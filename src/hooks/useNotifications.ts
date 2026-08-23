import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    type: 'message' | 'status' | 'deadline';
    link?: string;
}

export function useNotifications() {
    const { userId, userRole } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    // Load from localStorage on mount/user change
    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            return;
        }
        const saved = localStorage.getItem(`pm_notifications_${userId}`);
        if (saved) {
            setNotifications(JSON.parse(saved));
        } else {
            // Seed a welcome notification if empty
            const welcome: NotificationItem = {
                id: 'welcome',
                title: 'Welcome to ProjectMatch!',
                message: 'Start exploring live projects and apply to gain hands-on experience.',
                timestamp: new Date().toISOString(),
                read: false,
                type: 'status',
                link: '/projects'
            };
            setNotifications([welcome]);
            localStorage.setItem(`pm_notifications_${userId}`, JSON.stringify([welcome]));
        }
    }, [userId]);

    // Save helper
    const saveNotifications = useCallback((items: NotificationItem[]) => {
        if (!userId) return;
        setNotifications(items);
        localStorage.setItem(`pm_notifications_${userId}`, JSON.stringify(items));
    }, [userId]);

    const addNotification = useCallback((
        title: string, 
        message: string, 
        type: 'message' | 'status' | 'deadline', 
        link?: string
    ) => {
        const newItem: NotificationItem = {
            id: Math.random().toString(36).substring(2, 9),
            title,
            message,
            timestamp: new Date().toISOString(),
            read: false,
            type,
            link
        };
        const updated = [newItem, ...notifications];
        saveNotifications(updated);
        
        // Dispatch custom event for navbar badge synchronization
        window.dispatchEvent(new Event('pm_notifications_updated'));
    }, [notifications, saveNotifications]);

    const markAsRead = useCallback((id: string) => {
        const updated = notifications.map(item => 
            item.id === id ? { ...item, read: true } : item
        );
        saveNotifications(updated);
        window.dispatchEvent(new Event('pm_notifications_updated'));
    }, [notifications, saveNotifications]);

    const markAllAsRead = useCallback(() => {
        const updated = notifications.map(item => ({ ...item, read: true }));
        saveNotifications(updated);
        window.dispatchEvent(new Event('pm_notifications_updated'));
    }, [notifications, saveNotifications]);

    const clearAll = useCallback(() => {
        saveNotifications([]);
        window.dispatchEvent(new Event('pm_notifications_updated'));
    }, [saveNotifications]);

    // Set up database-level listeners for real-time notifications
    useEffect(() => {
        if (!userId) return;

        let chatChannel: any = null;
        let appChannel: any = null;

        // 1. Message listener (for both recruiters and students)
        chatChannel = supabase.channel('pm_realtime_chat_notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, async (payload) => {
                // If it's a message sent by someone else, check thread participant details
                if (payload.new.sender_id !== userId) {
                    const { data: thread } = await supabase
                        .from('message_threads')
                        .select('id, student_id, recruiter_id, projects(role)')
                        .eq('id', payload.new.thread_id)
                        .single();

                    if (thread && (thread.student_id === userId || thread.recruiter_id === userId)) {
                        const projectRole = Array.isArray(thread.projects)
                            ? (thread.projects as any)[0]?.role
                            : (thread.projects as any)?.role;
                        addNotification(
                            'New Message',
                            `You received a new message regarding project: ${projectRole || 'Live Project'}`,
                            'message',
                            userRole === 'student' ? '/dashboard/student' : '/dashboard/recruiter'
                        );
                    }
                }
            })
            .subscribe();

        // 2. Application update listener (mainly for students receiving decisions)
        if (userRole === 'student') {
            appChannel = supabase.channel('pm_realtime_app_notifications')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'applications',
                    filter: `student_id=eq.${userId}`
                }, async (payload) => {
                    // Fetch project role
                    const { data: proj } = await supabase
                        .from('projects')
                        .select('role')
                        .eq('id', payload.new.project_id)
                        .single();

                    addNotification(
                        'Application Update',
                        `Your application to "${proj?.role || 'Live Project'}" has been updated to: ${payload.new.status.toUpperCase()}`,
                        'status',
                        '/dashboard/student'
                    );
                })
                .subscribe();
        }

        return () => {
            if (chatChannel) supabase.removeChannel(chatChannel);
            if (appChannel) supabase.removeChannel(appChannel);
        };

    }, [userId, userRole, addNotification]);

    return {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll
    };
}
