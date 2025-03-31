import { useEffect, useState } from 'react';
import { validateSupabaseConnection } from '../../utils/validateSupabase';

export default function SupabaseConnectionTest() {
    const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const checkConnection = async () => {
            const isConnected = await validateSupabaseConnection();
            setConnectionStatus(isConnected ? 'success' : 'error');
        };

        checkConnection();
    }, []);

    if (connectionStatus === 'loading') {
        return (
            <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50">
                Testing Supabase connection...
            </div>
        );
    }

    if (connectionStatus === 'error') {
        return (
            <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
                ❌ Supabase connection failed. Check console for details.
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 opacity-80 hover:opacity-100 transition-opacity">
            ✅ Supabase connection successful!
        </div>
    );
} 