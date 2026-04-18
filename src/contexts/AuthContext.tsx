import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase, supabaseConfigured } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { UserTier } from '@/types/team';

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    tier: UserTier | null;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    isReady: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, full_name: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const navigate = useNavigate();

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }
            if (!data) return null;
            return data as Profile;
        } catch (err) {
            console.error('Profile fetch failed:', err);
            return null;
        }
    };

    // Keep track of the last profile fetch to avoid redundant calls
    const lastFetchedUserId = React.useRef<string | null>(null);

    useEffect(() => {
        if (!supabaseConfigured) {
            setIsLoading(false);
            setIsReady(true);
            return;
        }

        // Listen for auth changes (sign in/out/token refresh/initial session)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    const userId = currentSession.user.id;
                    // Only fetch profile if user has changed or hasn't been fetched yet
                    if (lastFetchedUserId.current !== userId) {
                        lastFetchedUserId.current = userId;
                        const profileData = await fetchProfile(userId);
                        setProfile(profileData);
                    }
                } else {
                    lastFetchedUserId.current = null;
                    setProfile(null);
                }

                setIsLoading(false);
                setIsReady(true);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error(error.message);
            throw error;
        }
        if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            setIsLoading(true); // Temporary loading to wait for profile
            const profileData = await fetchProfile(data.session.user.id);
            lastFetchedUserId.current = data.session.user.id;
            setProfile(profileData);
            setIsLoading(false);
        }

        toast.success('Welcome back!');
        navigate('/dashboard');
    };

    const signup = async (email: string, password: string, full_name: string) => {
        const redirectUrl = `${window.location.origin}/`;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectUrl,
                data: {
                    full_name,
                },
            },
        });

        if (error) {
            if (error.message.includes('already registered')) {
                toast.error('This email is already registered. Please login instead.');
            } else {
                toast.error(error.message);
            }
            throw error;
        }

        if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            setIsLoading(true);
            const profileData = await fetchProfile(data.session.user.id);
            lastFetchedUserId.current = data.session.user.id;
            setProfile(profileData);
            setIsLoading(false);
            toast.success('Account created!');
            navigate('/dashboard');
        } else if (data.user) {
            toast.success('Check your email to confirm your account!');
        }
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error('Error signing out');
            throw error;
        }
        setSession(null);
        setUser(null);
        setProfile(null);
        lastFetchedUserId.current = null;
        
        toast.info('Logged out');
        navigate('/');
    };

    const refreshProfile = React.useCallback(async () => {
        if (user) {
            const profileData = await fetchProfile(user.id);
            setProfile(profileData);
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, profile, session, isLoading, isReady, login, signup, logout, refreshProfile }}>
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
