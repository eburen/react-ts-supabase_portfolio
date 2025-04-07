import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    duration?: number;
}

interface NotificationContextType {
    notifications: Notification[];
    showNotification: (message: string, type: NotificationType, duration?: number) => void;
    hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const hideNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, []);

    const showNotification = useCallback(
        (message: string, type: NotificationType = 'info', duration = 3000) => {
            const id = Date.now().toString();
            const notification: Notification = {
                id,
                message,
                type,
                duration,
            };

            setNotifications((prev) => [...prev, notification]);

            if (duration !== Infinity) {
                setTimeout(() => {
                    hideNotification(id);
                }, duration);
            }

            return id;
        },
        [hideNotification]
    );

    // Clear all notifications when component unmounts
    useEffect(() => {
        return () => {
            setNotifications([]);
        };
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                showNotification,
                hideNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
} 