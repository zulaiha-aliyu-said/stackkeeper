import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase, supabaseConfigured } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
}

interface ImpersonationState {
    active: boolean;
    targetEmail: string | null;
    targetName: string | null;
    adminEmail: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    isReady: boolean;
    isImpersonating: boolean;
    impersonation: ImpersonationState;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, full_name: string) => Promise<void>;
    logout: () => Promise<void>;
    impersonateUser: (userId: string) => Promise<void>;
    stopImpersonating: () => Promise<void>;
}

const IMPERSONATION_KEY = 'sv_impersonation';
const ADMIN_SESSION_KEY = 'sv_admin_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readImpersonation(): ImpersonationState {
    try {
        const raw = sessionStorage.getItem(IMPERSONATION_KEY);
        if (!raw) {
            return { active: false, targetEmail: null, targetName: null, adminEmail: null };
        }
        return JSON.parse(raw) as ImpersonationState;
    } catch {
        return { active: false, targetEmail: null, targetName: null, adminEmail: null };
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [impersonation, setImpersonation] = useState<ImpersonationState>(() =>
        typeof window !== 'undefined'
            ? readImpersonation()
            : { active: false, targetEmail: null, targetName: null, adminEmail: null }
    );
    const navigate = useNavigate();

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }
            return data as Profile;
        } catch (err) {
            console.error('Profile fetch failed:', err);
            return null;
        }
    };

    useEffect(() => {
        if (!supabaseConfigured) {
            setIsLoading(false);
            setIsReady(true);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).then(setProfile);
            }
            setIsLoading(false);
            setIsReady(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    setTimeout(() => {
                        fetchProfile(session.user.id).then(setProfile);
                    }, 0);
                } else {
                    setProfile(null);
                }
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
            fetchProfile(data.session.user.id).then(setProfile);
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

        if (data.user && !data.session) {
            toast.success('Check your email to confirm your account!');
        } else {
            if (data.session) {
                setSession(data.session);
                setUser(data.session.user);
                fetchProfile(data.session.user.id).then(setProfile);
            }
            toast.success('Account created!');
            navigate('/dashboard');
        }
    };

    const clearImpersonation = useCallback(() => {
        sessionStorage.removeItem(IMPERSONATION_KEY);
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        setImpersonation({ active: false, targetEmail: null, targetName: null, adminEmail: null });
    }, []);

    const logout = async () => {
        clearImpersonation();
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error('Error signing out');
            throw error;
        }
        toast.info('Logged out');
        navigate('/');
    };

    const impersonateUser = async (userId: string) => {
        if (!session) {
            toast.error('You must be signed in as admin');
            throw new Error('No session');
        }

        const { data, error } = await supabase.functions.invoke('admin-impersonate', {
            body: { user_id: userId },
        });

        if (error) {
            const message =
                (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) ||
                error.message ||
                'Impersonation failed';
            toast.error(message);
            throw error;
        }

        if (data?.error) {
            toast.error(data.error);
            throw new Error(data.error);
        }

        if (!data?.token_hash) {
            toast.error('Invalid impersonation response');
            throw new Error('Missing token_hash');
        }

        sessionStorage.setItem(
            ADMIN_SESSION_KEY,
            JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
            })
        );

        const nextImpersonation: ImpersonationState = {
            active: true,
            targetEmail: data.email ?? null,
            targetName: data.full_name ?? null,
            adminEmail: session.user.email ?? null,
        };
        sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(nextImpersonation));
        setImpersonation(nextImpersonation);

        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: data.token_hash,
            type: 'email',
        });

        if (otpError) {
            clearImpersonation();
            toast.error(otpError.message || 'Failed to start impersonation session');
            throw otpError;
        }

        if (otpData.session) {
            setSession(otpData.session);
            setUser(otpData.session.user);
            fetchProfile(otpData.session.user.id).then(setProfile);
        }

        toast.success(`Now viewing as ${data.email}`);
        navigate('/dashboard');
    };

    const stopImpersonating = async () => {
        const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
        if (!raw) {
            clearImpersonation();
            toast.error('Admin session not found. Please sign in again.');
            await supabase.auth.signOut();
            navigate('/auth');
            return;
        }

        try {
            const saved = JSON.parse(raw) as { access_token: string; refresh_token: string };
            const { data, error } = await supabase.auth.setSession({
                access_token: saved.access_token,
                refresh_token: saved.refresh_token,
            });

            if (error) {
                clearImpersonation();
                toast.error('Could not restore admin session. Please sign in again.');
                await supabase.auth.signOut();
                navigate('/auth');
                throw error;
            }

            clearImpersonation();

            if (data.session) {
                setSession(data.session);
                setUser(data.session.user);
                fetchProfile(data.session.user.id).then(setProfile);
            }

            toast.success('Exited impersonation');
            navigate('/admin');
        } catch (err) {
            clearImpersonation();
            throw err;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                isLoading,
                isReady,
                isImpersonating: impersonation.active,
                impersonation,
                login,
                signup,
                logout,
                impersonateUser,
                stopImpersonating,
            }}
        >
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
