import { supabase } from '../lib/supabase';

/**
 * Validate Supabase connection by fetching a simple health check
 * @returns Promise<boolean> - True if connection is successful
 */
export const validateSupabaseConnection = async (): Promise<boolean> => {
    try {
        // Simple query to check if we can connect to Supabase
        // Avoid using count() aggregate function since it's not allowed
        const { data, error } = await supabase.from('products').select('id').limit(1);

        if (error) {
            console.error('Supabase connection error:', error);
            return false;
        }

        console.log('Supabase connection successful', data);
        return true;
    } catch (err) {
        console.error('Unexpected error during Supabase connection check:', err);
        return false;
    }
}; 