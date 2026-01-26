/**
 * AuthModal - Login and Signup Modal
 * 
 * FEATURES:
 * - Citizens can signup with email/password + name
 * - All roles can login
 * - Authority/Analyst use internal IDs (created manually in Firebase)
 * - Redirects to role-appropriate dashboard after auth
 */

import React, { useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import styles from './AuthModal.module.css';
import { Mail, Lock, User, Shield, BarChart3, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [role, setRole] = useState<UserRole>('citizen');

    // Sync state with props when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setRole('citizen');
            setError(null);
            // Clear form fields
            setEmail('');
            setPassword('');
            setName('');
            setAuthorityId('');
            setApaId('');
        }
    }, [isOpen, initialMode]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [authorityId, setAuthorityId] = useState('');
    const [apaId, setApaId] = useState('');

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                // Login flow
                let idOrEmail = email;
                if (role === 'authority') idOrEmail = authorityId;
                if (role === 'analyst') idOrEmail = apaId;

                const { error: signInError } = await signIn(idOrEmail, password, role);
                if (signInError) throw signInError;
            } else {
                // Signup flow - Only citizens can signup
                if (!name.trim()) {
                    throw new Error('Please enter your name');
                }
                if (!email.trim()) {
                    throw new Error('Please enter your email');
                }
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters');
                }

                const { error: signUpError } = await signUp(email, password, name);
                if (signUpError) throw signUpError;
            }

            onClose();
            // Navigate to appropriate dashboard based on role
            navigate(`/dashboard?mode=${role}`);
        } catch (err: any) {
            console.error('[AuthModal] Error:', err);
            // Provide user-friendly error messages
            let errorMessage = err.message || 'An error occurred';
            if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please sign up.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please login.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderRoleTabs = () => {
        // Only citizens can sign up; all roles can login
        const availableRoles: UserRole[] = mode === 'login' ? ['citizen', 'authority', 'analyst'] : ['citizen'];

        return (
            <div className={styles.roleTabs}>
                {availableRoles.map((r) => (
                    <button
                        key={r}
                        type="button"
                        className={`${styles.roleTab} ${role === r ? styles.activeRole : ''}`}
                        onClick={() => setRole(r)}
                    >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                ))}
            </div>
        );
    };

    const renderDemoCredentials = () => {
        if (mode !== 'login') return null;

        let demo = { id: '', pass: 'demo123', label: '' };
        if (role === 'citizen') demo = { id: 'citizen@airpulse.demo', pass: 'demo123', label: 'Email' };
        if (role === 'authority') demo = { id: 'DEL-AUTH-01', pass: 'demo123', label: 'Authority ID' };
        if (role === 'analyst') demo = { id: 'APA-001', pass: 'demo123', label: 'APA ID' };

        return (
            <div className={styles.demoBox}>
                <p>Demo Credentials:</p>
                <span>{demo.label}: {demo.id}</span>
                <span>Password: {demo.pass}</span>
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'login' ? 'Welcome Back' : 'Create Account'}
        >
            <div className={styles.container}>
                {renderRoleTabs()}

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Name field - only for signup */}
                    {mode === 'signup' && role === 'citizen' && (
                        <div className={styles.inputGroup}>
                            <User className={styles.inputIcon} size={20} />
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {/* Email field - for citizens */}
                    {role === 'citizen' && (
                        <div className={styles.inputGroup}>
                            <Mail className={styles.inputIcon} size={20} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {/* Authority ID field */}
                    {role === 'authority' && (
                        <div className={styles.inputGroup}>
                            <Shield className={styles.inputIcon} size={20} />
                            <input
                                type="text"
                                placeholder="Authority ID (e.g. DEL-AUTH-01)"
                                value={authorityId}
                                onChange={(e) => setAuthorityId(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {/* Analyst ID field */}
                    {role === 'analyst' && (
                        <div className={styles.inputGroup}>
                            <BarChart3 className={styles.inputIcon} size={20} />
                            <input
                                type="text"
                                placeholder="APA ID (e.g. APA-001)"
                                value={apaId}
                                onChange={(e) => setApaId(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {/* Password field */}
                    <div className={styles.inputGroup}>
                        <Lock className={styles.inputIcon} size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? <Loader2 className={styles.spinner} size={20} /> : (mode === 'login' ? 'Login' : 'Sign Up')}
                    </button>
                </form>

                {/* Toggle between login/signup modes */}
                <div className={styles.toggleMode}>
                    {mode === 'login' ? (
                        role === 'citizen' && (
                            <>
                                Don't have an account?{" "}
                                <button onClick={() => {
                                    setMode('signup');
                                    setRole('citizen');
                                    setError(null);
                                }}>
                                    Sign Up
                                </button>
                            </>
                        )
                    ) : (
                        <>
                            Already have an account?{" "}
                            <button onClick={() => {
                                setMode('login');
                                setError(null);
                            }}>
                                Login
                            </button>
                        </>
                    )}
                </div>

                {renderDemoCredentials()}
            </div>
        </Modal>
    );
};
