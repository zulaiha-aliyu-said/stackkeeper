import React, { createContext, useContext, useState, useEffect } from 'react';
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
 
 interface AuthContextType {
     user: User | null;
     profile: Profile | null;
     session: Session | null;
     isLoading: boolean;
     login: (email: string, password: string) => Promise<void>;
     signup: (email: string, password: string, full_name: string) => Promise<void>;
     logout: () => Promise<void>;
 }
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
     const [user, setUser] = useState<User | null>(null);
     const [session, setSession] = useState<Session | null>(null);
     const [profile, setProfile] = useState<Profile | null>(null);
     const [isLoading, setIsLoading] = useState(true);
     const navigate = useNavigate();
 
     const fetchProfile = async (userId: string) => {
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
     };
 
    useEffect(() => {
        if (!supabaseConfigured) {
            setIsLoading(false);
            return;
        }

        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                // Defer profile fetch to avoid deadlock
                if (session?.user) {
                    setTimeout(() => {
                        fetchProfile(session.user.id).then(setProfile);
                    }, 0);
                } else {
                    setProfile(null);
                }
            }
        );

        // THEN check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).then(setProfile);
            }
            setIsLoading(false);
        });

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
 
         // Check if email confirmation is required
         if (data.user && !data.session) {
             toast.success('Check your email to confirm your account!');
         } else {
             toast.success('Account created!');
             navigate('/dashboard');
         }
     };
 
     const logout = async () => {
         const { error } = await supabase.auth.signOut();
         if (error) {
             toast.error('Error signing out');
             throw error;
         }
         toast.info('Logged out');
         navigate('/');
     };
 
     return (
         <AuthContext.Provider value={{ user, profile, session, isLoading, login, signup, logout }}>
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
