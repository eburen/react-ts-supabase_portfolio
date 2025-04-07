import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

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
    clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const hideNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const showNotification = useCallback(
        (message: string, type: NotificationType = 'info', duration = 2000) => {
            const id = Date.now().toString();
            const notification: Notification = {
                id,
                message,
                type,
                duration,
            };

            // Limit to 3 notifications at a time
            setNotifications((prev) => {
                const updatedNotifications = [...prev, notification];
                if (updatedNotifications.length > 3) {
                    // Remove the oldest notification
                    return updatedNotifications.slice(1);
                }
                return updatedNotifications;
            });

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
                clearAllNotifications,
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