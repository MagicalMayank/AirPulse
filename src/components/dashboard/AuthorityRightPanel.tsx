/**
 * AuthorityRightPanel - Complaint Management for Authorities
 * 
 * FEATURES:
 * - View all complaints in real-time
 * - Filter by status
 * - Update complaint status (Pending -> In Progress -> Resolved)
 * 
 * UPDATED: Uses Firestore via AirQualityContext
 */

import { useState } from 'react';
import { ClipboardList, BarChart3, Users, Bell, CheckCircle, MapPin, Loader2, ExternalLink, Filter } from 'lucide-react';
import styles from './AuthorityPanels.module.css';
import { useAirQuality } from '../../context/AirQualityContext';
import type { Complaint } from '../../types';

type TabType = 'actions' | 'analytics' | 'teams';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'resolved';

export const AuthorityRightPanel = () => {
    const [activeTab, setActiveTab] = useState<TabType>('actions');

    return (
        <div className={styles.panelContainer}>
            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'actions' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('actions')}
                >
                    <ClipboardList size={14} />
                    Actions
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    <BarChart3 size={14} />
                    Analytics
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'teams' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('teams')}
                >
                    <Users size={14} />
                    Teams
                </button>
            </div>

            {activeTab === 'actions' && <ActionsTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'teams' && <TeamsTab />}
        </div>
    );
};

const ActionsTab = () => {
    const { complaints, complaintsLoading: loading, complaintsError: error, refreshComplaints, updateComplaintStatus } = useAirQuality();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // Handle status update
    const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'in_progress' | 'resolved') => {
        await updateComplaintStatus(id, newStatus);
    };

    if (error) return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ff6b6b' }}>
            <p style={{ fontSize: '0.85rem' }}>Failed to load complaints</p>
            <p style={{ fontSize: '0.7rem', color: '#888' }}>{error}</p>
            <button
                onClick={() => refreshComplaints()}
                style={{ background: 'none', border: '1px solid #444', color: '#888', padding: '4px 12px', borderRadius: '4px', marginTop: '8px', cursor: 'pointer' }}
            >
                Retry
            </button>
        </div>
    );

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className={styles.spinner} /></div>;

    // Filter complaints based on status
    const filteredComplaints = statusFilter === 'all'
        ? complaints
        : complaints.filter(c => c.status === statusFilter);

    const pendingComplaints = filteredComplaints.filter(c => c.status !== 'resolved');
    const recentResolutions = complaints.filter(c => c.status === 'resolved').slice(0, 5);

    return (
        <>
            {/* Status Filter */}
            <div className={styles.filterBar}>
                <Filter size={14} />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className={styles.filterSelect}
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>

            {/* Priority Queue */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Live Complaints</span>
                    <span className={styles.queueCount}>{pendingComplaints.length} active</span>
                </div>
                <div className={styles.actionList}>
                    {pendingComplaints.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>No active complaints</p>
                    ) : (
                        pendingComplaints.map(complaint => (
                            <ActionItem
                                key={complaint.id}
                                complaint={complaint}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Recent Resolutions */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Recent Resolutions</span>
                    <a href="#" className={styles.viewAllLink}>View All</a>
                </div>
                <div className={styles.resolutionList}>
                    {recentResolutions.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>No resolutions yet</p>
                    ) : (
                        recentResolutions.map(complaint => (
                            <ResolutionItem
                                key={complaint.id}
                                title={complaint.pollution_type}
                                location={complaint.location_text}
                                time={new Date(complaint.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Escalation Alerts */}
            <div className={styles.alertCard}>
                <div className={styles.alertHeader}>
                    <Bell size={14} color="var(--status-error)" />
                    <span>System Insight</span>
                </div>
                <p className={styles.alertText}>
                    Monitor real-time reports and update status to keep citizens informed.
                </p>
            </div>
        </>
    );
};

const ActionItem = ({ complaint, onUpdateStatus }: {
    complaint: Complaint;
    onUpdateStatus: (id: string, status: 'pending' | 'in_progress' | 'resolved') => void
}) => {
    const [isUpdating, setIsUpdating] = useState(false);

    // Format pollution type for display
    const formatPollutionType = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const priorityColor = complaint.pollution_type === 'garbage_burning' || complaint.pollution_type === 'industrial_smoke'
        ? 'var(--status-error)'
        : 'var(--status-warning)';

    const nextStatus = complaint.status === 'pending' ? 'in_progress' : 'resolved';
    const statusLabel = complaint.status === 'pending' ? 'Pending' : 'In Progress';
    const nextStatusLabel = nextStatus === 'in_progress' ? 'In Progress' : 'Resolved';

    const handleClick = async () => {
        setIsUpdating(true);
        await onUpdateStatus(complaint.id, nextStatus);
        setIsUpdating(false);
    };

    return (
        <div className={styles.actionItem} style={{ borderLeftColor: priorityColor }}>
            <div className={styles.actionHeader}>
                <span className={styles.actionTitle}>{formatPollutionType(complaint.pollution_type)}</span>
                <span className={styles.actionStatus} style={{ color: complaint.status === 'in_progress' ? 'var(--aqi-moderate)' : '#888' }}>
                    {statusLabel}
                </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <div className={styles.actionTime} style={{ marginBottom: '0.25rem' }}>
                        <MapPin size={12} /> {complaint.location_text}
                    </div>
                    <p style={{ fontSize: '0.7rem', color: '#AAA', margin: '0 0 0.5rem 0' }}>{complaint.description}</p>
                </div>
                {complaint.photo_url && (
                    <a href={complaint.photo_url} target="_blank" rel="noopener noreferrer" className={styles.photoThumb}>
                        <img src={complaint.photo_url} alt="Proof" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                        <ExternalLink size={10} className={styles.photoLinkIcon} />
                    </a>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                    className={styles.statusUpdateBtn}
                    onClick={handleClick}
                    disabled={isUpdating}
                >
                    {isUpdating ? <Loader2 size={12} className={styles.spinner} /> : `Move to ${nextStatusLabel}`}
                </button>
            </div>
        </div>
    );
};

const ResolutionItem = ({ title, location, time }: { title: string; location: string; time: string }) => {
    const formatTitle = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className={styles.resolutionItem}>
            <CheckCircle size={16} color="var(--status-success)" />
            <div className={styles.resolutionContent}>
                <span className={styles.resolutionTitle}>{formatTitle(title)}</span>
                <span className={styles.resolutionMeta}>{location} • Resolved at {time}</span>
            </div>
        </div>
    );
};

const AnalyticsTab = () => {
    const { complaints } = useAirQuality();

    // Calculate stats from complaints
    const totalComplaints = complaints.length;
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    complaints.forEach(c => {
        const type = c.pollution_type || 'unknown';
        categoryCounts[type] = (categoryCounts[type] || 0) + 1;
    });

    const categoryPercentages = Object.entries(categoryCounts).map(([label, count]) => ({
        label: label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0,
        color: getCategoryColor(label)
    }));

    return (
        <>
            {/* Resolution Stats */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Resolution Stats</span>
                    <span className={styles.metricBadge}>All Time</span>
                </div>
                <div className={styles.metricDisplay}>
                    <span className={styles.metricValue}>{resolvedComplaints}</span>
                    <span className={styles.metricUnit}>/ {totalComplaints} resolved</span>
                    <span className={styles.metricChange} style={{ color: 'var(--status-success)' }}>
                        {totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0}% completion rate
                    </span>
                </div>
            </div>

            {/* Complaints by Category */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Complaints by Source</span>
                </div>
                <div className={styles.categoryList}>
                    {categoryPercentages.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>No data yet</p>
                    ) : (
                        categoryPercentages.map(cat => (
                            <CategoryBar key={cat.label} label={cat.label} value={cat.value} color={cat.color} />
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

const getCategoryColor = (type: string): string => {
    const colors: Record<string, string> = {
        'garbage_burning': 'var(--source-biomass)',
        'construction_dust': 'var(--source-construction)',
        'vehicle_emission': 'var(--source-traffic)',
        'industrial_smoke': 'var(--source-industry)',
    };
    return colors[type] || '#888';
};

const CategoryBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className={styles.categoryRow}>
        <span className={styles.categoryLabel}>{label}</span>
        <div className={styles.categoryBarTrack}>
            <div className={styles.categoryBarFill} style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
        <span className={styles.categoryValue}>{value}%</span>
    </div>
);

const TeamsTab = () => (
    <>
        {/* Team Overview */}
        <div className={styles.teamOverview}>
            <div className={styles.teamStat}>
                <span className={styles.teamStatValue}>8</span>
                <span className={styles.teamStatLabel}>Total Teams</span>
            </div>
            <div className={styles.teamStat}>
                <span className={styles.teamStatValue} style={{ color: 'var(--aqi-moderate)' }}>5</span>
                <span className={styles.teamStatLabel}>Deployed</span>
            </div>
            <div className={styles.teamStat}>
                <span className={styles.teamStatValue} style={{ color: 'var(--status-success)' }}>3</span>
                <span className={styles.teamStatLabel}>Available</span>
            </div>
        </div>

        {/* Active Deployments */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Active Deployments</span>
            </div>
            <div className={styles.deploymentList}>
                <DeploymentCard
                    team="Team Alpha"
                    location="Okhla Phase III"
                    task="Garbage Burning Investigation"
                    eta="15 mins"
                />
            </div>
        </div>
    </>
);

const DeploymentCard = ({ team, location, task, eta }: { team: string; location: string; task: string; eta: string }) => (
    <div className={styles.deploymentCard}>
        <div className={styles.deploymentHeader}>
            <span className={styles.deploymentTeam}>{team}</span>
            <span className={styles.deploymentEta}>ETA: {eta}</span>
        </div>
        <div className={styles.deploymentLocation}>
            <MapPin size={12} /> {location}
        </div>
        <div className={styles.deploymentTask}>{task}</div>
    </div>
);
