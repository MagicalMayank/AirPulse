import { useState } from 'react';
import { Search, AlertCircle, Users, CheckCircle, Clock, MapPin, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from '../common/Button';
import type { WardProperties } from '../../types';
import styles from './AuthorityPanels.module.css';

interface AuthorityLeftPanelProps {
    selectedWard?: WardProperties | null;
}

export const AuthorityLeftPanel = ({ selectedWard }: AuthorityLeftPanelProps) => {
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'escalated'>('all');
    const [expandedSections, setExpandedSections] = useState({
        hotspots: true,
        teams: false
    });

    const wardName = selectedWard?.Ward_Name || 'All Wards';

    const toggleSection = (section: 'hotspots' | 'teams') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

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
                    <span className={styles.wardBadge}>{wardName}</span>
                </div>

                <div className={styles.statsRow}>
                    <StatBox
                        icon={<AlertCircle size={16} />}
                        value="47"
                        label="Total Active"
                        color="var(--brand-primary)"
                    />
                    <StatBox
                        icon={<Clock size={16} />}
                        value="23"
                        label="Pending"
                        color="var(--status-warning)"
                    />
                </div>
                <div className={styles.statsRow}>
                    <StatBox
                        icon={<CheckCircle size={16} />}
                        value="18"
                        label="Resolved Today"
                        color="var(--status-success)"
                    />
                    <StatBox
                        icon={<AlertCircle size={16} />}
                        value="6"
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
                    {(['all', 'pending', 'resolved', 'escalated'] as const).map(status => (
                        <button
                            key={status}
                            className={`${styles.filterBtn} ${statusFilter === status ? styles.filterBtnActive : ''}`}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
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
                <Button variant="primary" size="sm" className={styles.actionBtn}>
                    📋 Generate Report
                </Button>
                <Button variant="outline" size="sm" className={styles.actionBtn}>
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
