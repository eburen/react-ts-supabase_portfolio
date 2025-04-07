import { useEffect } from 'react';
import { validateSupabaseConnection } from '../../utils/validateSupabase';
import { useNotification } from '../../context/NotificationContext';

export default function SupabaseConnectionTest() {
    const { showNotification } = useNotification();

    useEffect(() => {
        const checkConnection = async () => {
            const isConnected = await validateSupabaseConnection();

            if (isConnected) {
                showNotification('Supabase connection successful!', 'success');
            } else {
                showNotification('Supabase connection failed. Check console for details.', 'error', 5000);
            }
        };

        checkConnection();
    }, [showNotification]);

    // Render nothing, just handle the notification
    return null;
} 