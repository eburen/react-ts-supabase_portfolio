import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Toast } from './Toast';

export const ToastContainer: React.FC = () => {
    const { notifications, hideNotification } = useNotification();

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
            {notifications.map((notification) => (
                <Toast
                    key={notification.id}
                    notification={notification}
                    onClose={hideNotification}
                />
            ))}
        </div>
    );
}; 