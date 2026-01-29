/**
 * AuthorityRightPanel - Complaint Management for Authorities
 * 
 * FEATURES:
 * - View all complaints in real-time
 * - Collapsible Stack Design (Top 3)
 * - View All Drawer for full complaint list
 * - Update complaint status (Pending -> In Progress -> Resolved)
 */

import { useState } from 'react';
import { ClipboardList, BarChart3, Users, Bell, MapPin, Loader2, ExternalLink, Filter, ChevronDown, ChevronUp } from 'lucide-react';
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
    const [isExpanded, setIsExpanded] = useState(false);

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

    const displayComplaints = statusFilter === 'all'
        ? complaints.filter(c => c.status !== 'resolved')
        : complaints.filter(c => c.status === statusFilter);

    return (
        <>
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

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                        {statusFilter === 'resolved' ? 'Resolved Reports' : 'Live Complaints'} ({displayComplaints.length})
                    </span>
                </div>
                <div className={styles.actionList}>
                    {displayComplaints.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>
                            No {statusFilter === 'resolved' ? 'resolved' : 'active'} complaints
                        </p>
                    ) : (
                        <>
                            {(isExpanded ? displayComplaints : displayComplaints.slice(0, 3)).map(complaint => (
                                <ActionItem
                                    key={complaint.id}
                                    complaint={complaint}
                                    onUpdateStatus={handleUpdateStatus}
                                />
                            ))}

                            {displayComplaints.length > 3 && (
                                <button
                                    className={styles.viewAllBtn}
                                    onClick={() => setIsExpanded(!isExpanded)}
                                >
                                    {isExpanded ? (
                                        <><ChevronUp size={14} /> Show Less</>
                                    ) : (
                                        <><ChevronDown size={14} /> View All ({displayComplaints.length})</>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

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
    const [showDetails, setShowDetails] = useState(false);

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
        <>
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className={styles.viewBtn} onClick={() => setShowDetails(true)}>View</button>
                    <button className={styles.statusUpdateBtn} onClick={handleClick} disabled={isUpdating}>
                        {isUpdating ? <Loader2 size={12} className={styles.spinner} /> : `Move to ${nextStatusLabel}`}
                    </button>
                </div>
            </div>

            {showDetails && (
                <div className={styles.modalBackdrop} onClick={() => setShowDetails(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{formatPollutionType(complaint.pollution_type)}</h3>
                            <button onClick={() => setShowDetails(false)} className={styles.modalClose}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>ID</span>
                                <span className={styles.detailValue}>{complaint.id}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Location</span>
                                <span className={styles.detailValue}>{complaint.location_text}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Description</span>
                                <span className={styles.detailValue}>{complaint.description}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Status</span>
                                <span className={styles.detailValue} style={{
                                    color: complaint.status === 'resolved' ? 'var(--status-success)' :
                                        complaint.status === 'in_progress' ? 'var(--aqi-moderate)' : '#888'
                                }}>
                                    {statusLabel}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Submitted</span>
                                <span className={styles.detailValue}>{new Date(complaint.created_at).toLocaleString()}</span>
                            </div>
                            {complaint.photo_url && (
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Photo Evidence</span>
                                    <a href={complaint.photo_url} target="_blank" rel="noopener noreferrer">
                                        <img src={complaint.photo_url} alt="Evidence" style={{ width: '100%', maxWidth: '200px', borderRadius: '8px', marginTop: '0.5rem' }} />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const AnalyticsTab = () => {
    const { complaints } = useAirQuality();
    const totalComplaints = complaints.length;
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

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
