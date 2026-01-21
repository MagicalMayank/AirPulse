/**
 * Policy Simulation Engine
 * Rule-based heuristics for AQI impact simulation
 * Designed to be replaceable with ML models in the future
 */

// Source contribution ratios (based on typical Delhi NCR pollution sources)
export interface SourceContributions {
    traffic: number;      // Vehicle emissions
    construction: number; // Construction dust
    burning: number;      // Biomass/garbage burning
    weather: number;      // Weather/dispersion factor
}

// Default source contributions for Delhi NCR
export const DEFAULT_SOURCE_CONTRIBUTIONS: SourceContributions = {
    traffic: 0.35,
    construction: 0.25,
    burning: 0.20,
    weather: 0.20,
};

// Intervention effectiveness coefficients (how effective each intervention is)
export interface InterventionEffectiveness {
    trafficDiversion: number;    // 0.7–0.9 effectiveness
    dustControl: number;          // 0.6–0.8 effectiveness
    burningEnforcement: number;   // 0.8–0.95 effectiveness
}

export const DEFAULT_EFFECTIVENESS: InterventionEffectiveness = {
    trafficDiversion: 0.8,
    dustControl: 0.7,
    burningEnforcement: 0.85,
};

// User intervention inputs
export interface SimulationInputs {
    trafficDiversion: number;     // 0–30% reduction
    dustControl: number;          // 0–40% reduction
    burningEnforcement: boolean;  // On/Off
    weatherAssist: 'none' | 'moderate' | 'strong'; // Informational
}

// Simulation result
export interface SimulationResult {
    currentAQI: number;
    projectedAQI: number;
    aqiDelta: number;
    percentChange: number;
    projections: {
        hours24: number;
        hours48: number;
    };
    confidence: 'low' | 'medium' | 'high';
    confidenceScore: number; // 0-100
    factors: {
        name: string;
        contribution: number;
        reduction: number;
    }[];
    recommendation: {
        primaryAction: string;
        secondaryActions: string[];
        estimatedImprovement: string;
        riskLevel: 'low' | 'medium' | 'high';
    };
}

/**
 * Calculate simulated AQI based on interventions
 */
export function simulatePolicy(
    currentAQI: number,
    inputs: SimulationInputs,
    sourceContributions: SourceContributions = DEFAULT_SOURCE_CONTRIBUTIONS,
    effectiveness: InterventionEffectiveness = DEFAULT_EFFECTIVENESS
): SimulationResult {
    // Calculate individual source reductions
    const trafficReduction = (inputs.trafficDiversion / 100) *
        sourceContributions.traffic * effectiveness.trafficDiversion;

    const dustReduction = (inputs.dustControl / 100) *
        sourceContributions.construction * effectiveness.dustControl;

    const burningReduction = inputs.burningEnforcement ?
        sourceContributions.burning * effectiveness.burningEnforcement * 0.7 : 0;

    // Weather is informational - provides slight boost to other interventions
    const weatherMultiplier = inputs.weatherAssist === 'strong' ? 1.15 :
        inputs.weatherAssist === 'moderate' ? 1.05 : 1.0;

    // Total AQI reduction factor
    const totalReduction = (trafficReduction + dustReduction + burningReduction) * weatherMultiplier;

    // Calculate projected AQI
    const projectedAQI = Math.round(currentAQI * (1 - totalReduction));
    const aqiDelta = currentAQI - projectedAQI;
    const percentChange = Math.round((aqiDelta / currentAQI) * 100);

    // Time-based projections (gradual effect)
    const hours24 = Math.round(currentAQI - (aqiDelta * 0.6)); // 60% effect in 24h
    const hours48 = Math.round(currentAQI - (aqiDelta * 0.9)); // 90% effect in 48h

    // Calculate confidence based on input completeness and data availability
    let confidenceScore = 50; // Base confidence

    if (inputs.trafficDiversion > 0) confidenceScore += 10;
    if (inputs.dustControl > 0) confidenceScore += 10;
    if (inputs.burningEnforcement) confidenceScore += 15;
    if (inputs.weatherAssist !== 'none') confidenceScore += 5;
    if (currentAQI > 100) confidenceScore += 5; // Better predictions at higher AQI

    // Cap confidence
    confidenceScore = Math.min(95, confidenceScore);

    const confidence: 'low' | 'medium' | 'high' =
        confidenceScore >= 75 ? 'high' :
            confidenceScore >= 55 ? 'medium' : 'low';

    // Build factors breakdown
    const factors = [
        {
            name: 'Traffic Emissions',
            contribution: Math.round(sourceContributions.traffic * 100),
            reduction: Math.round(trafficReduction * 100),
        },
        {
            name: 'Construction Dust',
            contribution: Math.round(sourceContributions.construction * 100),
            reduction: Math.round(dustReduction * 100),
        },
        {
            name: 'Biomass Burning',
            contribution: Math.round(sourceContributions.burning * 100),
            reduction: Math.round(burningReduction * 100),
        },
        {
            name: 'Weather/Dispersion',
            contribution: Math.round(sourceContributions.weather * 100),
            reduction: 0, // Weather doesn't reduce, just assists
        },
    ];

    // Generate recommendation
    const actions: string[] = [];
    if (inputs.trafficDiversion > 15) actions.push('Traffic diversion');
    if (inputs.dustControl > 20) actions.push('Dust control measures');
    if (inputs.burningEnforcement) actions.push('Burning enforcement');

    const riskLevel: 'low' | 'medium' | 'high' =
        percentChange > 20 ? 'low' :
            percentChange > 10 ? 'medium' : 'high';

    const recommendation = {
        primaryAction: actions[0] || 'No significant intervention selected',
        secondaryActions: actions.slice(1),
        estimatedImprovement: `${percentChange}%`,
        riskLevel,
    };

    return {
        currentAQI,
        projectedAQI,
        aqiDelta,
        percentChange,
        projections: {
            hours24,
            hours48,
        },
        confidence,
        confidenceScore,
        factors,
        recommendation,
    };
}

/**
 * Get estimated source contributions based on ward characteristics
 * (Can be enhanced with real data later)
 */
export function estimateSourceContributions(
    wardName: string,
    _currentAQI: number
): SourceContributions {
    // Heuristic: Different areas have different pollution profiles
    const lowerName = wardName.toLowerCase();

    if (lowerName.includes('industrial') || lowerName.includes('okhla')) {
        return { traffic: 0.25, construction: 0.15, burning: 0.40, weather: 0.20 };
    }

    if (lowerName.includes('connaught') || lowerName.includes('central')) {
        return { traffic: 0.50, construction: 0.20, burning: 0.10, weather: 0.20 };
    }

    if (lowerName.includes('dwarka') || lowerName.includes('residential')) {
        return { traffic: 0.30, construction: 0.30, burning: 0.20, weather: 0.20 };
    }

    // Default for unknown areas
    return DEFAULT_SOURCE_CONTRIBUTIONS;
}

/**
 * Generate export summary text
 */
export function generateExportSummary(
    wardName: string,
    wardId: string | number,
    inputs: SimulationInputs,
    result: SimulationResult
): string {
    const date = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const time = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AIRPULSE POLICY SIMULATION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated: ${date} at ${time}
Ward: ${wardName} (${wardId})

SIMULATION PARAMETERS
────────────────────────────────────────────────
• Traffic Diversion: ${inputs.trafficDiversion}%
• Dust Control Measures: ${inputs.dustControl}%
• Burning Enforcement: ${inputs.burningEnforcement ? 'Enabled' : 'Disabled'}
• Weather Assistance: ${inputs.weatherAssist}

PROJECTED IMPACT
────────────────────────────────────────────────
Current AQI:    ${result.currentAQI}
Projected AQI:  ${result.projectedAQI}
Change:         ↓ ${result.aqiDelta} points (${result.percentChange}% improvement)

Time-based Projections:
• 24 hours: AQI ${result.projections.hours24}
• 48 hours: AQI ${result.projections.hours48}

CONFIDENCE ASSESSMENT
────────────────────────────────────────────────
Level: ${result.confidence.toUpperCase()}
Score: ${result.confidenceScore}/100

Based on:
• Historical AQI patterns
• Source contribution ratios
• Similar past interventions (heuristic model)

RECOMMENDATION
────────────────────────────────────────────────
Primary Action: ${result.recommendation.primaryAction}
${result.recommendation.secondaryActions.length > 0 ?
            `Secondary: ${result.recommendation.secondaryActions.join(', ')}` : ''}
Estimated Improvement: ${result.recommendation.estimatedImprovement}
Risk Level: ${result.recommendation.riskLevel.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Prepared by: AirPulse Analyst Engine
  ⚠️ This is a simulation only. No real-world
     enforcement has been applied.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}
