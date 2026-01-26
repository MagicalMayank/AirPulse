/**
 * AuthContext - Firebase Authentication
 * 
 * FEATURES:
 * - Email/Password login for all roles
 * - Anonymous login for citizens (no email required)
 * - Role-based profiles stored in Firestore /users/{uid}
 * 
 * ROLES:
 * - citizen: Can use anonymous or email login (only role for new signups)
 * - authority: Uses internal ID (DEL-AUTH-01) as synthetic email (manual creation)
 * - analyst: Uses internal ID (APA-001) as synthetic email (manual creation)
 * 
 * FIRESTORE SCHEMA /users/{uid}:
 * {
 *   name: string,
 *   email: string,
 *   role: "citizen" | "authority" | "analyst",
 *   createdAt: serverTimestamp()
 * }
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    signInAnonymously,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserRole } from '../types';

// User profile stored in Firestore
export interface UserProfile {
    id: string;
    name?: string;
    email?: string;
    role: UserRole;
    authority_id?: string;
    apa_id?: string;
    createdAt?: string;
}

interface AuthContextType {
    // State
    user: User | null;
    profile: UserProfile | null;
    userRole: UserRole | null;
    loading: boolean;
    isAuthenticated: boolean;

    // Actions
    signIn: (idOrEmail: string, password: string, role: UserRole) => Promise<{ error: any }>;
    signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    anonymousLogin: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Derived state
    const userRole = profile?.role || null;
    const isAuthenticated = !!user && !!profile;

    /**
     * Infer role from email for @airpulse.auth users
     */
    const inferRoleFromEmail = (email: string | null): UserRole | null => {
        if (!email) return null;

        const lowerEmail = email.toLowerCase();

        // Authority emails contain "auth" in the ID part
        if (lowerEmail.includes('auth-') && lowerEmail.endsWith('@airpulse.auth')) {
            return 'authority';
        }

        // Analyst emails start with "apa-"
        if (lowerEmail.startsWith('apa-') && lowerEmail.endsWith('@airpulse.auth')) {
            return 'analyst';
        }

        return 'citizen';
    };

    /**
     * Fetch user profile from Firestore /users/{uid}
     * For @airpulse.auth users without a profile, create one with inferred role
     */
    const fetchProfile = useCallback(async (firebaseUser: User): Promise<UserProfile | null> => {
        const userId = firebaseUser.uid;
        const email = firebaseUser.email;

        try {
            console.log('[AuthContext] Fetching profile for:', userId, email);
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('[AuthContext] Profile found:', data.role);
                return {
                    id: userId,
                    name: data.name,
                    email: data.email,
                    role: data.role || 'citizen',
                    authority_id: data.authority_id,
                    apa_id: data.apa_id,
                    createdAt: data.createdAt?.toDate?.()?.toISOString(),
                };
            } else {
                // No profile exists - create one based on email pattern
                console.log('[AuthContext] No profile found, creating based on email...');

                const inferredRole = inferRoleFromEmail(email);
                let profileData: any = {
                    role: inferredRole || 'citizen',
                    email: email,
                    createdAt: serverTimestamp(),
                };

                // Set role-specific fields
                if (inferredRole === 'authority') {
                    // Extract authority ID from email (e.g., del-auth-01@airpulse.auth -> DEL-AUTH-01)
                    const authorityId = email?.split('@')[0]?.toUpperCase() || 'UNKNOWN';
                    profileData.name = 'Authority User';
                    profileData.authority_id = authorityId;
                } else if (inferredRole === 'analyst') {
                    // Extract analyst ID from email (e.g., apa-001@airpulse.auth -> APA-001)
                    const apaId = email?.split('@')[0]?.toUpperCase() || 'UNKNOWN';
                    profileData.name = 'Analyst User';
                    profileData.apa_id = apaId;
                } else {
                    profileData.name = 'Anonymous User';
                }

                await setDoc(docRef, profileData);
                console.log('[AuthContext] Created profile with role:', profileData.role);

                return {
                    id: userId,
                    ...profileData,
                    createdAt: new Date().toISOString(),
                };
            }
        } catch (err) {
            console.error('[AuthContext] Error fetching profile:', err);
            return null;
        }
    }, []);

    /**
     * Listen to auth state changes
     */
    useEffect(() => {
        console.log('[AuthContext] Setting up auth listener...');

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('[AuthContext] Auth state changed:', firebaseUser?.email || firebaseUser?.uid || 'none');

            setUser(firebaseUser);

            if (firebaseUser) {
                const profileData = await fetchProfile(firebaseUser);
                setProfile(profileData);
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchProfile]);

    /**
     * Anonymous login for citizens (no email required)
     */
    const anonymousLogin = async () => {
        try {
            console.log('[AuthContext] Attempting anonymous login...');
            setLoading(true);
            await signInAnonymously(auth);
            return { error: null };
        } catch (err: any) {
            console.error('[AuthContext] Anonymous login error:', err);
            return { error: err };
        }
    };

    /**
     * Sign in with email/password
     * For authority/analyst, converts internal ID to synthetic email
     */
    const signIn = async (idOrEmail: string, password: string, role: UserRole) => {
        try {
            let email = idOrEmail;

            // Convert internal IDs to synthetic emails for non-citizen roles
            if (role === 'authority') {
                email = `${idOrEmail.toLowerCase()}@airpulse.auth`;
            } else if (role === 'analyst') {
                email = `${idOrEmail.toLowerCase()}@airpulse.auth`;
            }

            console.log('[AuthContext] SignIn attempting for:', email, 'role:', role);
            setLoading(true);

            await signInWithEmailAndPassword(auth, email, password);

            console.log('[AuthContext] SignIn success');
            return { error: null };
        } catch (err: any) {
            console.error('[AuthContext] SignIn error:', err.message);
            setLoading(false);
            return { error: err };
        }
    };

    /**
     * Sign up new citizen user
     * Creates auth user + Firestore profile in /users/{uid}
     * 
     * NOTE: Only citizens can sign up. Authority/Analyst accounts are created manually.
     */
    const signUp = async (email: string, password: string, name: string) => {
        try {
            console.log('[AuthContext] SignUp starting for:', email);
            setLoading(true);

            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;

            console.log('[AuthContext] Auth user created:', userId);

            // Create Firestore profile - only citizens can sign up
            await setDoc(doc(db, 'users', userId), {
                name: name,
                email: email,
                role: 'citizen', // New users are always citizens
                createdAt: serverTimestamp(),
            });

            console.log('[AuthContext] Profile created successfully');
            return { error: null };
        } catch (err: any) {
            console.error('[AuthContext] SignUp error:', err.message);
            setLoading(false);
            return { error: err };
        }
    };

    /**
     * Sign out and redirect to home
     */
    const signOut = async () => {
        console.log('[AuthContext] Signing out...');
        await firebaseSignOut(auth);
        setProfile(null);

        // Redirect to home page
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            userRole,
            loading,
            isAuthenticated,
            signIn,
            signUp,
            signOut,
            anonymousLogin
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
