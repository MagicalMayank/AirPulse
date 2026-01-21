import { useState } from 'react';
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
import { AirQualityProvider } from '../context/AirQualityContext';
import type { WardProperties } from '../types';

export const Dashboard = () => {
    const [selectedWard, setSelectedWard] = useState<WardProperties | null>(null);
    const [role, setRole] = useState<'citizen' | 'authority' | 'analyst'>('citizen');
    const [advancedMode, setAdvancedMode] = useState(false);

    const getLeftPanel = () => {
        switch (role) {
            case 'analyst':
                return <AnalystLeftPanel selectedWard={selectedWard} />;
            case 'authority':
                return <AuthorityLeftPanel selectedWard={selectedWard} />;
            default:
                return <LeftPanel selectedWard={selectedWard} />;
        }
    };

    const getRightPanel = () => {
        switch (role) {
            case 'analyst':
                return <AnalystRightPanel />;
            case 'authority':
                return <AuthorityRightPanel />;
            default:
                return <RightPanel />;
        }
    };

    // Show Advanced Analyst Layout when in Analyst mode with Advanced Mode ON
    if (role === 'analyst' && advancedMode) {
        return (
            <AirQualityProvider>
                <Navbar
                    role={role}
                    onRoleChange={(r) => setRole(r as any)}
                    advancedMode={advancedMode}
                    onAdvancedModeChange={setAdvancedMode}
                />
                <AdvancedAnalystLayout
                    selectedWard={selectedWard}
                    onWardSelect={setSelectedWard}
                    onExitAdvanced={() => setAdvancedMode(false)}
                />
            </AirQualityProvider>
        );
    }

    return (
        <AirQualityProvider>
            <Navbar
                role={role}
                onRoleChange={(r) => setRole(r as any)}
                advancedMode={advancedMode}
                onAdvancedModeChange={role === 'analyst' ? setAdvancedMode : undefined}
            />
            <DashboardLayout
                leftPanel={getLeftPanel()}
                centerPanel={<MapContainer onWardSelect={setSelectedWard} role={role} />}
                rightPanel={getRightPanel()}
            />
        </AirQualityProvider>
    );
};


