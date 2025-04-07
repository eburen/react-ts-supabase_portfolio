import React, { useEffect, useState } from 'react';
import {
    CheckCircleIcon,
    XCircleIcon,
    InformationCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/solid';
import { Notification, NotificationType } from '../../context/NotificationContext';

interface ToastProps {
    notification: Notification;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timeout = setTimeout(() => {
            setIsVisible(true);
        }, 10);

        return () => clearTimeout(timeout);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose(notification.id);
        }, 300); // Wait for exit animation to complete
    };

    const getIconByType = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />;
            case 'error':
                return <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />;
            case 'info':
            default:
                return <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />;
        }
    };

    const getBackgroundColorByType = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return 'bg-green-50';
            case 'error':
                return 'bg-red-50';
            case 'info':
            default:
                return 'bg-blue-50';
        }
    };

    const getBorderColorByType = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return 'border-green-200';
            case 'error':
                return 'border-red-200';
            case 'info':
            default:
                return 'border-blue-200';
        }
    };

    const getTextColorByType = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return 'text-green-800';
            case 'error':
                return 'text-red-800';
            case 'info':
            default:
                return 'text-blue-800';
        }
    };

    return (
        <div
            className={`transform transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                } max-w-xs ${getBackgroundColorByType(notification.type)} border ${getBorderColorByType(
                    notification.type
                )} rounded-lg shadow-md pointer-events-auto`}
            style={{ minWidth: '200px', maxWidth: '300px' }}
        >
            <div className="p-2.5">
                <div className="flex items-start">
                    <div className="flex-shrink-0">{getIconByType(notification.type)}</div>
                    <div className="ml-2.5 w-0 flex-1 pt-0.5">
                        <p className={`text-xs font-medium ${getTextColorByType(notification.type)}`}>
                            {notification.message}
                        </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                        <button
                            type="button"
                            className={`inline-flex rounded-md ${getBackgroundColorByType(
                                notification.type
                            )} text-gray-400 hover:text-gray-500 focus:outline-none`}
                            onClick={handleClose}
                        >
                            <span className="sr-only">Close</span>
                            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}; 