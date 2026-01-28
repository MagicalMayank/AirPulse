import { useState } from 'react';
import { Search, AlertCircle, Users, CheckCircle, Clock, MapPin, ChevronDown, ChevronUp, Filter, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';
import type { WardProperties } from '../../types';
import styles from './AuthorityPanels.module.css';
import { useAirQuality } from '../../context/AirQualityContext';

interface AuthorityLeftPanelProps {
    selectedWard?: WardProperties | null;
}

export const AuthorityLeftPanel = ({ selectedWard }: AuthorityLeftPanelProps) => {
    const { complaints, complaintsLoading: loading, complaintsError: error } = useAirQuality();
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
    const [expandedSections, setExpandedSections] = useState({
        hotspots: true,
        teams: false
    });

    const activeCount = complaints.filter(c => c.status !== 'resolved').length;
    const pendingCount = complaints.filter(c => c.status === 'pending').length;
    const resolvedTodayCount = complaints.filter(c => c.status === 'resolved').length; // Simplified

    const wardName = selectedWard?.Ward_Name || 'All Wards';

    const toggleSection = (section: 'hotspots' | 'teams') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Generate Report functionality
    const handleGenerateReport = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
        });

        // Category breakdown
        const categoryCounts: Record<string, number> = {};
        complaints.forEach(c => {
            const type = c.pollution_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            categoryCounts[type] = (categoryCounts[type] || 0) + 1;
        });

        const categoryBreakdown = Object.entries(categoryCounts)
            .map(([type, count]) => `  • ${type}: ${count} complaints`)
            .join('\n');

        const report = `
╔══════════════════════════════════════════════════════════════╗
║                    AIRPULSE AUTHORITY REPORT                  ║
╠══════════════════════════════════════════════════════════════╣
║  Generated: ${dateStr} at ${timeStr}
║  Ward: ${wardName}
╚══════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COMPLAINTS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Active Complaints: ${activeCount}
Pending Resolution: ${pendingCount}
Resolved: ${resolvedTodayCount}
Escalated: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BREAKDOWN BY TYPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${categoryBreakdown || '  No complaints reported'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DETAILED COMPLAINT LOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${complaints.map((c, i) => `
[${i + 1}] ${c.pollution_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    Status: ${c.status.replace(/_/g, ' ').toUpperCase()}
    Location: ${c.location_text}
    Description: ${c.description}
    Submitted: ${new Date(c.created_at).toLocaleString()}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HOTSPOT AREAS (Requires Attention)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🔴 Okhla Phase III - 12 complaints (Garbage Burning) - CRITICAL
  🟠 Lajpat Nagar - 8 complaints (Construction Dust) - HIGH
  🟡 Saket - 5 complaints (Traffic Congestion) - MEDIUM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Generated by AirPulse Authority Dashboard
  © 2026 AirPulse Smart City Initiative
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        // Download the report
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AirPulse_Authority_Report_${now.toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Send Alert functionality
    const handleSendAlert = () => {
        const alertMessage = `
🚨 AIRPULSE POLLUTION ALERT 🚨

Ward: ${wardName}
Active Complaints: ${activeCount}
Pending: ${pendingCount}

Top Concerns:
🔴 Garbage Burning - Okhla Phase III
🟠 Construction Dust - Lajpat Nagar

Action Required: Immediate attention needed.
Timestamp: ${new Date().toLocaleString()}

---
Sent via AirPulse Authority Dashboard
`;
        // Download alert message
        const blob = new Blob([alertMessage], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AirPulse_Alert_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        // Also show a browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('AirPulse Alert Sent', {
                body: `Alert for ${wardName} with ${activeCount} active complaints has been generated.`,
                icon: '/Mask group.svg'
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        alert(`✅ Alert generated and downloaded!\n\nWard: ${wardName}\nActive Complaints: ${activeCount}`);
    };

    if (error) return (
        <div className={styles.panelContainer}>
            <div style={{ textAlign: 'center', padding: '2rem', color: '#ff6b6b' }}>
                <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem' }}>Failed to load complaints</p>
                <p style={{ fontSize: '0.7rem', color: '#888' }}>{error}</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    style={{ marginTop: '1rem' }}
                >
                    Retry
                </Button>
            </div>
        </div>
    );

    if (loading) return <div className={styles.loading}><Loader2 className={styles.spinner} /></div>;

    return (
        <div className={styles.panelContainer}>
            {/* Search */}
            <div className={styles.searchBox}>
                <Search size={18} className={styles.searchIcon} />
                <input type="text" placeholder="Search complaints, wards..." className={styles.searchInput} />
            </div>

            {/* Complaints Overview Card */}
            <div className={styles.overviewCard}>
                <div className={styles.overviewHeader}>
                    <span className={styles.overviewLabel}>COMPLAINTS OVERVIEW</span>
                    <span className={styles.wardBadge}>{wardName}{selectedWard?.isEstimated ? ' (Estimated)' : ''}</span>
                </div>

                <div className={styles.statsRow}>
                    <StatBox
                        icon={<AlertCircle size={16} />}
                        value={activeCount.toString()}
                        label="Total Active"
                        color="var(--brand-primary)"
                    />
                    <StatBox
                        icon={<Clock size={16} />}
                        value={pendingCount.toString()}
                        label="Pending"
                        color="var(--status-warning)"
                    />
                </div>
                <div className={styles.statsRow}>
                    <StatBox
                        icon={<CheckCircle size={16} />}
                        value={resolvedTodayCount.toString()}
                        label="Resolved"
                        color="var(--status-success)"
                    />
                    <StatBox
                        icon={<AlertCircle size={16} />}
                        value="0"
                        label="Escalated"
                        color="var(--status-error)"
                    />
                </div>
            </div>

            {/* Status Filter */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Filter size={14} />
                    <span>Filter by Status</span>
                </div>
                <div className={styles.filterButtons}>
                    {(['all', 'pending', 'in_progress', 'resolved'] as const).map(status => (
                        <button
                            key={status}
                            className={`${styles.filterBtn} ${statusFilter === status ? styles.filterBtnActive : ''}`}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hotspot Alerts */}
            <div className={styles.collapsible}>
                <button className={styles.collapseHeader} onClick={() => toggleSection('hotspots')}>
                    <AlertCircle size={14} color="var(--status-error)" />
                    <span>Hotspot Alerts</span>
                    <span className={styles.alertCount}>3</span>
                    {expandedSections.hotspots ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.hotspots && (
                    <div className={styles.collapseContent}>
                        <HotspotItem
                            ward="Okhla Phase III"
                            complaints={12}
                            issue="Garbage Burning"
                            severity="critical"
                        />
                        <HotspotItem
                            ward="Lajpat Nagar"
                            complaints={8}
                            issue="Construction Dust"
                            severity="high"
                        />
                        <HotspotItem
                            ward="Saket"
                            complaints={5}
                            issue="Traffic Congestion"
                            severity="medium"
                        />
                    </div>
                )}
            </div>

            {/* Team Status */}
            <div className={styles.collapsible}>
                <button className={styles.collapseHeader} onClick={() => toggleSection('teams')}>
                    <Users size={14} color="var(--brand-secondary)" />
                    <span>Field Teams</span>
                    {expandedSections.teams ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.teams && (
                    <div className={styles.collapseContent}>
                        <TeamItem name="Team Alpha" status="deployed" location="Okhla" />
                        <TeamItem name="Team Beta" status="available" location="—" />
                        <TeamItem name="Team Gamma" status="deployed" location="Lajpat Nagar" />
                        <Button variant="outline" size="sm" className={styles.deployBtn}>
                            + Deploy New Team
                        </Button>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <Button variant="primary" size="sm" className={styles.actionBtn} onClick={handleGenerateReport}>
                    📋 Generate Report
                </Button>
                <Button variant="outline" size="sm" className={styles.alertActionBtn} onClick={handleSendAlert}>
                    📢 Send Alert
                </Button>
            </div>
        </div>
    );
};

const StatBox = ({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) => (
    <div className={styles.statBox}>
        <div className={styles.statIcon} style={{ color }}>{icon}</div>
        <div className={styles.statContent}>
            <span className={styles.statValue}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
        </div>
    </div>
);

const HotspotItem = ({ ward, complaints, issue, severity }: {
    ward: string;
    complaints: number;
    issue: string;
    severity: 'critical' | 'high' | 'medium'
}) => {
    const severityColor = severity === 'critical' ? 'var(--status-error)' :
        severity === 'high' ? 'var(--aqi-poor)' : 'var(--status-warning)';
    return (
        <div className={styles.hotspotItem} style={{ borderLeftColor: severityColor }}>
            <div className={styles.hotspotHeader}>
                <span className={styles.hotspotWard}>{ward}</span>
                <span className={styles.hotspotCount}>{complaints} complaints</span>
            </div>
            <div className={styles.hotspotIssue}>{issue}</div>
        </div>
    );
};

const TeamItem = ({ name, status, location }: { name: string; status: 'deployed' | 'available'; location: string }) => {
    const statusColor = status === 'deployed' ? 'var(--aqi-moderate)' : 'var(--status-success)';
    return (
        <div className={styles.teamItem}>
            <div className={styles.teamInfo}>
                <span className={styles.teamName}>{name}</span>
                <span className={styles.teamLocation}>
                    <MapPin size={12} /> {location}
                </span>
            </div>
            <span className={styles.teamStatus} style={{ color: statusColor }}>
                ● {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        </div>
    );
};
