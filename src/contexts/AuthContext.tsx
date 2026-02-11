
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface UserProfile {
    user_id: string;
    username: string;
    email: string;
    img_url: string;
    primeiro_acesso: boolean;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async (uid: string) => {
        console.log('Fetching profile for UID:', uid);

        try {
            const queryStartTime = performance.now();

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000);
            });

            // Race the query against the timeout
            const queryPromise = supabase
                .from('users')
                .select('*')
                .eq('user_id', uid)
                .maybeSingle();

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

            const queryDuration = performance.now() - queryStartTime;
            console.log(`✅ Query completed in ${queryDuration.toFixed(2)}ms`);

            if (error) {
                console.error('❌ Error fetching profile:', error);
                console.log('Error details - message:', error.message, 'code:', error.code);
                return;
            }

            console.log('Profile fetched raw data:', data);

            if (data) {
                console.log('Profile keys:', Object.keys(data));
                console.log('primeiro_acesso value:', data.primeiro_acesso);
                setProfile(data);
            } else {
                console.warn('⚠️ Profile not found for this user in public.users table. Attempting recovery...');

                // Auto Recovery: Create profile from Auth metadata
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    console.log('Creating profile for user:', authUser.id);
                    const { data: newData, error: insertError } = await supabase
                        .from('users')
                        .insert({
                            user_id: authUser.id,
                            email: authUser.email,
                            username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'Usuario',
                            primeiro_acesso: true, // Default to true for recovered/new users
                            img_url: 'https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/sign/img_user/profile_pics/padrao.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82YzdhYzE0NS00N2RmLTQ3ZjItYWYyMi0xZDFkOTE0NTM3Y2EiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWdfdXNlci9wcm9maWxlX3BpY3MvcGFkcmFvLmpwZyIsImlhdCI6MTc1OTI0Mzk1MiwiZXhwIjo4ODE1OTE1NzU1Mn0.AWDYc1mewJEuVqVSeUlJJykNj801mzyMequTNPHqfL0'
                        })
                        .select()
                        .single();

                    if (insertError) {
                        console.error('❌ Recovery failed:', insertError);
                    } else {
                        console.log('✅ Profile successfully recovered:', newData);
                        setProfile(newData);
                    }
                }
            }
        } catch (err) {
            console.error('💥 CRITICAL: Exception during fetchProfile:', err);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        console.log('AuthContext: Initialization started');
        let mounted = true;

        const initializeAuth = async () => {
            try {
                console.log('AuthContext: Getting session...');
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) console.error('AuthContext: Error getting session', error);

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        console.log('AuthContext: Session found, fetching profile...');
                        await fetchProfile(session.user.id);
                    } else {
                        console.log('AuthContext: No session found.');
                    }
                }
            } catch (error) {
                console.error('AuthContext: Critical error initializing auth:', error);
            } finally {
                if (mounted) {
                    console.log('AuthContext: Setup complete, disabling loading state.');
                    setIsLoading(false);
                }
            }
        };

        initializeAuth();

        // Safety timeout: If for some reason Supabase hangs, force app to load after 3s
        const timeoutId = setTimeout(() => {
            console.warn('AuthContext: Safety timeout triggered!');
            if (mounted) setIsLoading(false);
        }, 3000);

        // listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('AuthContext: Auth state changed:', event);
            try {
                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await fetchProfile(session.user.id);
                    } else {
                        setProfile(null);
                    }
                }
            } catch (error) {
                console.error('AuthContext: Error in auth state change:', error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        // 1. Immediately clear local state and redirect to ensure UI responsiveness
        console.log('AuthContext: User initiated sign out. Clearing local state immediately.');
        setSession(null);
        setUser(null);
        setProfile(null);
        navigate('/auth');

        // 2. Call Supabase sign out in the background (fire and forget / catch error)
        try {
            console.log('AuthContext: Calling Supabase signOut in background...');
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('AuthContext: Background signOut error (ignored for UX):', error);
            } else {
                console.log('AuthContext: Background signOut completed.');
            }
        } catch (error) {
            console.error('AuthContext: Unexpected error during background signOut:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, signOut, refreshProfile, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
