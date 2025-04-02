import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: any, user: User | null }>;
    signOut: () => Promise<void>;
    updateUserProfile: (userData: Partial<User>) => Promise<{ error: any, user: User | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);

            if (session?.user) {
                fetchUserProfile(session.user);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);

                if (session?.user) {
                    fetchUserProfile(session.user);
                } else {
                    setUser(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function fetchUserProfile(supabaseUser: SupabaseUser) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', supabaseUser.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching user profile:', error);
                return;
            }

            if (data) {
                setUser(data as User);
            }
        } catch (error) {
            console.error('Exception fetching user profile:', error);
        }
    }

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signUp = async (email: string, password: string, userData: Partial<User>) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: userData.full_name,
                    role: 'customer' // Default role for new users
                }
            }
        });

        if (!error && data.user) {
            // Create a user profile in our database
            const { error: profileError, data: profileData } = await supabase
                .from('users')
                .insert([
                    {
                        id: data.user.id,
                        email,
                        full_name: userData.full_name,
                        role: 'customer',
                    }
                ])
                .select();

            if (profileError) {
                return { error: profileError, user: null };
            }

            if (profileData && profileData.length > 0) {
                return { error: null, user: profileData[0] as User };
            }
        }

        return { error, user: null };
    };

    const updateUserProfile = async (userData: Partial<User>) => {
        if (!user) return { error: new Error('No user is logged in'), user: null };

        // Clean up userData to ensure proper handling of null/empty values
        const cleanedUserData: Record<string, any> = {};

        // Process each property to handle empty strings properly
        Object.entries(userData).forEach(([key, value]) => {
            // Convert empty strings to null, but keep actual string values
            if (value === '') {
                cleanedUserData[key] = null;
            } else {
                cleanedUserData[key] = value;
            }
        });

        try {
            // Update user in the database
            const { data, error } = await supabase
                .from('users')
                .update(cleanedUserData)
                .eq('id', user.id)
                .select();

            if (error) {
                console.error('Error updating profile:', error);
                return { error, user: null };
            }

            // If update was successful but no rows returned, fetch the profile again
            if (!data || data.length === 0) {
                await fetchUserProfile({ id: user.id } as SupabaseUser);
                return { error: null, user };
            }

            // If data was returned, update state with the new user data
            const updatedUser = data[0] as User;
            setUser(updatedUser);
            return { error: null, user: updatedUser };
        } catch (err) {
            console.error('Exception in updateUserProfile:', err);
            return { error: err, user: null };
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        updateUserProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 