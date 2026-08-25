import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
export type UserRole = 'student' | 'recruiter' | null;

// All localStorage keys owned by this app — used for targeted cleanup on logout
const APP_STORAGE_KEYS = [
    'userRole', 'userName', 'userEmail', 'userId', 'userPhoto',
    'hasCompletedProfile', 'pendingAuthRole',
    'studentSkills', 'studentDomain', 'studentResumeUrl',
];
const clearAppStorage = () => APP_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));

interface AuthContextType {
    userRole: UserRole;
    userName: string;
    userEmail: string;
    userPhoto: string | null;
    userId: string | null;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    hasCompletedProfile: boolean;
    login: (role: UserRole, name?: string, photoUrl?: string) => Promise<void>;
    loginWithGoogle: (role: UserRole) => Promise<void>;
    loginWithEmail: (email: string, password: string, role: UserRole) => Promise<void>;
    registerWithEmail: (email: string, password: string, name: string, role: UserRole, companyData?: any) => Promise<void>;
    verifyOtp: (email: string, otp: string, type?: 'signup' | 'magiclink' | 'recovery') => Promise<void>;
    logout: () => Promise<void>;
    updateUserPhoto: (photoUrl: string) => void;
    completeProfile: () => void;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [userName, setUserName] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true); // FIX #17: prevents flash of wrong route
    const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean>(false);

    useEffect(() => {
        // Hydrate initial state from localStorage for UX (so it doesn't flash logged out)
        const storedRole = localStorage.getItem('userRole') as UserRole;
        const storedName = localStorage.getItem('userName') || '';
        const storedEmail = localStorage.getItem('userEmail') || '';
        const storedPhoto = localStorage.getItem('userPhoto');
        const storedId = localStorage.getItem('userId');
        const storedCompleted = localStorage.getItem('hasCompletedProfile') === 'true';

        if (storedRole) {
            setUserRole(storedRole);
            setUserName(storedName);
            setUserEmail(storedEmail);
            setUserPhoto(storedPhoto);
            setUserId(storedId);
            setIsAuthenticated(true);
            setHasCompletedProfile(storedCompleted);
        }

        // Safety fallback: If auth state doesn't resolve in 3 seconds, unblock UI
        const authTimeout = setTimeout(() => {
            setIsAuthLoading(false);
        }, 3000);

        // Check for current session manually as a fallback for some Supabase client versions
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) setIsAuthLoading(false);
        });

        // Listen for Supabase Auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                const user = session.user;
                const metadata = user.user_metadata;

                // Priority 1: Backend Metadata. Priority 2: Pending Role. Default: student
                const pendingRole = localStorage.getItem('pendingAuthRole') as UserRole;
                const finalRole = metadata?.role as UserRole || pendingRole || 'student';

                const name = metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User';
                const photo = metadata.avatar_url || metadata.picture || null;

                // Sync to our local storage system and states
                localStorage.setItem('userRole', finalRole);
                localStorage.setItem('userName', name);
                localStorage.setItem('userEmail', user.email || '');
                localStorage.setItem('userId', user.id);
                if (photo) localStorage.setItem('userPhoto', photo);
                localStorage.removeItem('pendingAuthRole'); // clean up

                try {
                    // Check if profile exists, if not create it
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id, college, domain, company_name')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (!profile) {
                        const profileData: any = {
                            id: user.id,
                            role: finalRole,
                            name: name,
                            photo_url: photo
                        };
                        if (finalRole === 'recruiter') {
                            profileData.company_name = metadata.company_name || null;
                            profileData.company_website = metadata.company_website || null;
                        }
                        await supabase.from('profiles').insert([profileData]);
                    } else {
                        // FIX #2: Role-aware profile completion check
                        // Students need college + domain; Recruiters need company_name
                        const isComplete = finalRole === 'recruiter'
                            ? !!(profile.company_name)
                            : !!(profile.college && profile.domain);
                        if (isComplete) {
                            localStorage.setItem('hasCompletedProfile', 'true');
                            setHasCompletedProfile(true);
                        }
                    }
                } catch (err) {
                    console.error("Error ensuring profile exists:", err);
                }

                setUserRole(finalRole);
                setUserName(name);
                setUserEmail(user.email || '');
                setUserPhoto(photo);
                setUserId(user.id);
                setIsAuthenticated(true);
                setIsAuthLoading(false); // auth resolved
            } else if (event === 'SIGNED_OUT') {
                // FIX #4: Only clear app-owned keys, not all localStorage
                clearAppStorage();
                setUserRole(null);
                setUserName('');
                setUserEmail('');
                setUserPhoto(null);
                setUserId(null);
                setIsAuthenticated(false);
                setHasCompletedProfile(false);
                setIsAuthLoading(false); // auth resolved
            } else {
                // Any other event (TOKEN_REFRESHED, USER_UPDATED)
                setIsAuthLoading(false);
            }
        });

        return () => {
            clearTimeout(authTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const login = async (role: UserRole, name?: string, photoUrl?: string) => {
        const defaultName = role === 'student' ? 'Student' : 'Recruiter';
        const finalName = name || defaultName;

        localStorage.setItem('userRole', role || '');
        localStorage.setItem('userName', finalName);
        if (photoUrl) {
            localStorage.setItem('userPhoto', photoUrl);
            setUserPhoto(photoUrl);
        }

        setUserRole(role);
        setUserName(finalName);
        setIsAuthenticated(true);
    };

    const loginWithGoogle = async (role: UserRole) => {
        // Store intended role before redirecting out to Google
        localStorage.setItem('pendingAuthRole', role || 'student');

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });

        if (error) {
            console.error('Error logging in with Google', error);
            localStorage.removeItem('pendingAuthRole');
            throw error;
        }
    };

    const loginWithEmail = async (email: string, password: string, role: UserRole) => {
        // Let the onAuthStateChange handle setting the local state,
        // but we'll store the intended role just in case metadata is missing it
        // MUST BE SET BEFORE AWAITING SUPABASE
        localStorage.setItem('pendingAuthRole', role || 'student');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            localStorage.removeItem('pendingAuthRole');
            throw error;
        }
    };

    const registerWithEmail = async (email: string, password: string, name: string, role: UserRole, companyData?: any) => {
        // Prepare metadata.
        const metadata: any = {
            full_name: name,
            role: role
        };

        if (role === 'recruiter' && companyData) {
            metadata.company_name = companyData.companyName;
            metadata.company_website = companyData.companyWebsite;
        }

        // Save intended role for post-verification
        localStorage.setItem('pendingAuthRole', role || 'student');

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });

        if (error) {
            localStorage.removeItem('pendingAuthRole');
            throw error;
        }

        // If auto-confirm is enabled or we don't need OTP, we would sign in here
        // Since we are using OTP, we won't set local state until OTP is verified 
        // OR until the onAuthStateChange picks it up.
    };

    const verifyOtp = async (email: string, otp: string, type: 'signup' | 'magiclink' | 'recovery' = 'signup') => {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: type
        });

        if (error) throw error;

        // Local state will be handled by onAuthStateChange
    };

    const logout = async () => {
        // Sign out of Supabase with a timeout to prevent hanging forever
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Supabase signOut timeout')), 3000);
            });
            await Promise.race([supabase.auth.signOut(), timeoutPromise]);
        } catch (err) {
            console.error('Error signing out:', err);
        } finally {
            // Remove only Supabase session keys (not all localStorage)
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                    localStorage.removeItem(key);
                }
            });

            // FIX #4: Remove only app-owned keys to avoid data loss
            clearAppStorage();
            setUserRole(null);
            setUserName('');
            setUserEmail('');
            setUserPhoto(null);
            setUserId(null);
            setIsAuthenticated(false);
            setHasCompletedProfile(false);
        }
    };

    const updatePassword = async (currentPassword: string, newPassword: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) throw new Error("User not authenticated.");

        // Verify current password first
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        });

        if (signInError) {
            throw new Error("Incorrect current password.");
        }

        // Workaround for Supabase GoTrue issue: "Lock broken by another request with the 'steal' option"
        // This happens because signInWithPassword and updateUser trigger back-to-back session token refreshes.
        // Pausing briefly allows the first lock to release before requesting the second.
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            throw updateError;
        }
    };

    const updateUserPhoto = (photoUrl: string) => {
        localStorage.setItem('userPhoto', photoUrl);
        setUserPhoto(photoUrl);
    };

    const completeProfile = () => {
        localStorage.setItem('hasCompletedProfile', 'true');
        setHasCompletedProfile(true);
    };

    return (
        <AuthContext.Provider value={{
            userRole, userName, userEmail, userPhoto, userId, isAuthenticated, isAuthLoading, hasCompletedProfile,
            login, loginWithGoogle, loginWithEmail, registerWithEmail, verifyOtp,
            logout, updateUserPhoto, completeProfile, updatePassword
        }}>
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
