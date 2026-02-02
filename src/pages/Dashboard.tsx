/**
 * Dashboard Page
 * 
 * ROLE-BASED ACCESS:
 * - Citizens can only view Citizen Dashboard
 * - Authorities can only view Authority Dashboard
 * - Analysts can only view Analyst Dashboard
 * 
 * Redirects unauthenticated users to home page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LeftPanel } from '../components/dashboard/LeftPanel';
import { MapContainer } from '../components/dashboard/MapContainer';
import { RightPanel } from '../components/dashboard/RightPanel';
import { AnalystLeftPanel } from '../components/dashboard/AnalystLeftPanel';
import { AnalystRightPanel } from '../components/dashboard/AnalystRightPanel';
import { AuthorityLeftPanel } from '../components/dashboard/AuthorityLeftPanel';
import { AuthorityRightPanel } from '../components/dashboard/AuthorityRightPanel';
import { AdvancedAnalystLayout } from '../components/dashboard/AdvancedAnalystLayout';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/common/AuthModal';
import type { WardProperties } from '../types';
import { Loader2 } from 'lucide-react';

export const Dashboard = () => {
    const { userRole, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [selectedWard, setSelectedWard] = useState<WardProperties | null>(null);
    const [advancedMode, setAdvancedMode] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    
    // Active role state - allows Authority users to switch to Analyst mode
    const [activeRole, setActiveRole] = useState<'citizen' | 'authority' | 'analyst'>(userRole || 'citizen');

    // Update activeRole when userRole changes (on login/logout)
    useEffect(() => {
        if (userRole) {
            setActiveRole(userRole);
        }
    }, [userRole]);

    // The role used for rendering components
    const role = activeRole;

    // Show auth modal if not authenticated
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            setShowAuthModal(true);
        }
    }, [loading, isAuthenticated]);

    // Handle auth modal close - redirect to home if still not authenticated
    const handleAuthModalClose = () => {
        setShowAuthModal(false);
        if (!isAuthenticated) {
            navigate('/');
        }
    };

    // Show loading state while checking auth
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '1rem' }}>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Show auth modal if not authenticated
    if (!isAuthenticated) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Authentication Required</h2>
                    <p style={{ marginTop: '0.5rem', color: '#888' }}>Please login to access the dashboard</p>
                </div>
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={handleAuthModalClose}
                    initialMode="login"
                />
            </div>
        );
    }

    // Role change handler - Authority users can switch to Analyst, others stay locked
    const handleRoleChange = (newRole: 'citizen' | 'authority' | 'analyst') => {
        // Authority users can switch between Authority and Analyst
        if (userRole === 'authority' && (newRole === 'authority' || newRole === 'analyst')) {
            setActiveRole(newRole);
            return;
        }
        
        // All other users can only access their own role dashboard
        if (newRole !== userRole) {
            alert(`You can only access the ${userRole} dashboard. Login with a different account to access ${newRole} features.`);
            return;
        }
        
        setActiveRole(newRole);
    };

    const getLeftPanel = () => {
        switch (activeRole) {
            case 'analyst':
                return <AnalystLeftPanel selectedWard={selectedWard} />;
            case 'authority':
                return <AuthorityLeftPanel selectedWard={selectedWard} />;
            default:
                return <LeftPanel selectedWard={selectedWard} onSearchSelect={setSelectedWard} />;
        }
    };

    const getRightPanel = () => {
        switch (activeRole) {
            case 'analyst':
                return <AnalystRightPanel />;
            case 'authority':
                return <AuthorityRightPanel />;
            default:
                return <RightPanel />;
        }
    };

    // Show Advanced Analyst Layout when in Analyst mode with Advanced Mode ON
    if (activeRole === 'analyst' && advancedMode) {
        return (
            <>
                <Navbar
                    role={activeRole}
                    onRoleChange={handleRoleChange}
                    advancedMode={advancedMode}
                    onAdvancedModeChange={setAdvancedMode}
                />
                <AdvancedAnalystLayout
                    selectedWard={selectedWard}
                    onWardSelect={setSelectedWard}
                    onExitAdvanced={() => setAdvancedMode(false)}
                />
            </>
        );
    }

    return (
        <>
            <Navbar
                role={activeRole}
                onRoleChange={handleRoleChange}
                advancedMode={advancedMode}
                onAdvancedModeChange={activeRole === 'analyst' ? setAdvancedMode : undefined}
            />
            <DashboardLayout
                leftPanel={getLeftPanel()}
                centerPanel={<MapContainer onWardSelect={setSelectedWard} role={activeRole} />}
                rightPanel={getRightPanel()}
            />
        </>
    );
};
