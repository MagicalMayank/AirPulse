import React, { useMemo } from 'react';
import styles from './AnalystPanels.module.css';

interface DataPoint {
    timestamp: string;
    value: number;
}

export interface ChartSeries {
    id: string | number;
    name: string;
    data: DataPoint[];
    color: string;
}

interface LineChartProps {
    data?: DataPoint[];
    series?: ChartSeries[];
    height?: number;
    color?: string;
    showArea?: boolean;
    showPoints?: boolean;
    className?: string;
}

// Generate smooth curve path using Catmull-Rom spline
function generateSmoothPath(
    points: { x: number; y: number }[],
    tension: number = 0.3
): string {
    if (points.length < 2) return '';

    const path: string[] = [];
    path.push(`M ${points[0].x},${points[0].y}`);

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        // Calculate control points for cubic bezier
        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = p1.y + (p2.y - p0.y) * tension;
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = p2.y - (p3.y - p1.y) * tension;

        path.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
    }

    return path.join(' ');
}

export const LineChart: React.FC<LineChartProps> = ({
    data,
    series,
    height = 140,
    color = '#8B5CF6',
    showArea = true,
    showPoints = true,
    className
}) => {
    const width = 400;
    const padding = { top: 20, right: 20, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Normalize data into series
    const normalizedSeries = useMemo(() => {
        if (series && series.length > 0) return series;
        if (data && data.length > 0) {
            return [{
                id: 'default',
                name: 'Main',
                data,
                color
            }];
        }
        return [];
    }, [series, data, color]);

    const { processedSeries, yLabels, allPoints } = useMemo(() => {
        if (normalizedSeries.length === 0) {
            return { processedSeries: [], yLabels: [], allPoints: [] };
        }

        // Find global min/max across all series
        let min = Infinity;
        let max = -Infinity;
        let maxLen = 0;

        normalizedSeries.forEach(s => {
            s.data.forEach(d => {
                if (d.value < min) min = d.value;
                if (d.value > max) max = d.value;
            });
            if (s.data.length > maxLen) maxLen = s.data.length;
        });

        // Add padding to range
        min = min * 0.9;
        max = max * 1.1;
        const range = max - min || 1;

        const processed = normalizedSeries.map(s => {
            const pts = s.data.map((d, i) => ({
                x: padding.left + (i / (s.data.length - 1)) * chartWidth,
                y: padding.top + chartHeight - ((d.value - min) / range) * chartHeight,
                value: d.value,
                timestamp: d.timestamp
            }));

            const line = generateSmoothPath(pts.map(p => ({ x: p.x, y: p.y })));
            const area = line +
                ` L ${pts[pts.length - 1].x},${height - padding.bottom}` +
                ` L ${pts[0].x},${height - padding.bottom} Z`;

            return {
                ...s,
                points: pts,
                linePath: line,
                areaPath: area
            };
        });

        const labels = [
            { value: Math.round(max), y: padding.top },
            { value: Math.round((max + min) / 2), y: padding.top + chartHeight / 2 },
            { value: Math.round(min), y: padding.top + chartHeight }
        ];

        return { processedSeries: processed, yLabels: labels, allPoints: processed[0]?.points || [] };
    }, [normalizedSeries, height, chartHeight, chartWidth, padding.left, padding.top, padding.bottom]);

    if (normalizedSeries.length === 0) {
        return <div className={styles.chartPlaceholder}>No data available</div>;
    }

    return (
        <div className={styles.lineChartContainer}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className={`${styles.lineChart} ${className || ''}`}
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {processedSeries.map((s, i) => {
                        const chartId = `series-${s.id}-${i}`;
                        return (
                            <React.Fragment key={chartId}>
                                <linearGradient id={`areaGradient-${chartId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={s.color} stopOpacity="0.4" />
                                    <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                                </linearGradient>
                                <filter id={`glow-${chartId}`} x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </React.Fragment>
                        );
                    })}
                </defs>

                {/* Horizontal grid lines */}
                {[0.25, 0.5, 0.75].map((pos, i) => (
                    <line
                        key={i}
                        x1={padding.left}
                        y1={padding.top + chartHeight * pos}
                        x2={width - padding.right}
                        y2={padding.top + chartHeight * pos}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Y-axis labels */}
                {yLabels.map((label, i) => (
                    <text
                        key={i}
                        x={padding.left - 5}
                        y={label.y + 4}
                        fill="rgba(255,255,255,0.4)"
                        fontSize="9"
                        textAnchor="end"
                    >
                        {label.value}
                    </text>
                ))}

                {/* Series Tracks */}
                {processedSeries.map((s, i) => {
                    const chartId = `series-${s.id}-${i}`;
                    const currentPoint = s.points[s.points.length - 1];

                    return (
                        <g key={s.id}>
                            {showArea && (
                                <path
                                    d={s.areaPath}
                                    fill={`url(#areaGradient-${chartId})`}
                                    style={{ transition: 'all 0.5s ease' }}
                                />
                            )}
                            <path
                                d={s.linePath}
                                fill="none"
                                stroke={s.color}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter={`url(#glow-${chartId})`}
                                style={{ transition: 'all 0.5s ease' }}
                            />
                            {showPoints && currentPoint && (
                                <g>
                                    <circle
                                        cx={currentPoint.x}
                                        cy={currentPoint.y}
                                        r="4"
                                        fill="#fff"
                                        stroke={s.color}
                                        strokeWidth="2"
                                    />
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* X-axis time labels */}
                {allPoints.length > 0 && (
                    <>
                        <text
                            x={allPoints[0].x}
                            y={height - 8}
                            fill="rgba(255,255,255,0.4)"
                            fontSize="9"
                            textAnchor="start"
                        >
                            {new Date(allPoints[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </text>
                        <text
                            x={allPoints[allPoints.length - 1].x}
                            y={height - 8}
                            fill="rgba(255,255,255,0.4)"
                            fontSize="9"
                            textAnchor="end"
                        >
                            Now
                        </text>
                    </>
                )}
            </svg>
        </div>
    );
};
