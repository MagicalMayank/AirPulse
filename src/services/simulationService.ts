/**
 * Simulation Service
 * 
 * Handles API calls to the FastAPI backend for ML-powered policy simulation.
 * Uses XGBoost model predictions with SHAP explainability.
 * 
 * PRODUCTION: Uses Render-hosted backend
 */

// Backend API URL - Production on Render
const SIMULATION_API_URL = import.meta.env.VITE_SIMULATION_API_URL || 'https://airpulse-backend-vuhb.onrender.com';

// Request types (mapped from frontend inputs to API format)
// NOTE: Use SHORT parameter names for API query string
export interface SimulationAPIRequest {
    ward: string;           // Ward ID (e.g., "123" or "Ward 45")
    baseline_aqi: number;   // Current AQI from frontend
    traffic: number;        // 0-30 (percentage)
    dust: number;           // 0-40 (percentage)
    biomass: number;        // 0 or 1
    weather: number;        // 0 (none), 1 (moderate), 2 (strong)
}

// Response from backend (updated to match simplified production API)
export interface SimulationAPIResponse {
    status: string;
    ward: string;
    projected_aqi: number;
    impact_breakdown: ImpactBreakdown;
    // Optional fields (may not be in response)
    baseline_aqi?: number;
    total_reduction?: number;
    confidence_score?: number;
}

// SHAP-based impact breakdown (short key names from new backend)
export interface ImpactBreakdown {
    traffic: number;
    dust: number;
    biomass: number;
    weather: number;
}

// Error type for API failures
export interface SimulationAPIError {
    detail: string;
}

/**
 * Convert frontend weather assist value to API format
 */
function weatherToNumber(weatherAssist: 'none' | 'moderate' | 'strong'): number {
    switch (weatherAssist) {
        case 'none': return 0;
        case 'moderate': return 1;
        case 'strong': return 2;
        default: return 0;
    }
}

/**
 * Run simulation via backend API
 * 
 * @param params - Frontend simulation parameters
 * @param onColdStart - Optional callback when cold start is detected
 * @returns Promise with simulation results or throws error
 */
export async function runSimulation(params: {
    ward: string;                                    // Ward ID or name
    baselineAqi: number;                             // Current AQI from frontend
    trafficDiversion: number;
    dustControl: number;
    burningEnforcement: boolean;
    weatherAssist: 'none' | 'moderate' | 'strong';
}, onColdStart?: () => void): Promise<SimulationAPIResponse> {
    // Convert frontend params to API format
    // NOTE: Use SHORT parameter names for API query string
    const apiParams: SimulationAPIRequest = {
        ward: params.ward,
        baseline_aqi: params.baselineAqi,
        traffic: params.trafficDiversion,
        dust: params.dustControl,
        biomass: params.burningEnforcement ? 1 : 0,
        weather: weatherToNumber(params.weatherAssist),
    };

    // Build query string - Backend expects SHORT parameter names
    const queryString = new URLSearchParams({
        ward: apiParams.ward,
        baseline_aqi: apiParams.baseline_aqi.toString(),
        traffic: apiParams.traffic.toString(),
        dust: apiParams.dust.toString(),
        biomass: apiParams.biomass.toString(),
        weather: apiParams.weather.toString(),
    }).toString();

    const url = `${SIMULATION_API_URL}/simulate?${queryString}`;

    console.log('[SimulationService] Calling Production API:', url);

    // Set a timer to detect cold start (if request takes > 5s)
    let coldStartTimer: ReturnType<typeof setTimeout> | null = null;
    if (onColdStart) {
        coldStartTimer = setTimeout(() => {
            onColdStart();
        }, 5000);
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for Render cold start

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (coldStartTimer) clearTimeout(coldStartTimer);

        if (!response.ok) {
            // Try to parse error detail from response
            let errorMessage = `API Error: ${response.status}`;
            try {
                const errorData: SimulationAPIError = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch {
                // Ignore JSON parse error, use default message
            }

            if (response.status === 404) {
                throw new Error('Simulation endpoint not found. Please check the backend deployment.');
            } else if (response.status === 500) {
                throw new Error('ML model error on server. Please try again.');
            } else if (response.status === 503) {
                throw new Error('Backend is starting up. Please wait and try again.');
            }

            throw new Error(errorMessage);
        }

        const data: SimulationAPIResponse = await response.json();

        if (data.status !== 'success') {
            throw new Error('Simulation failed: Invalid response status');
        }

        console.log('[SimulationService] API Response:', data);
        return data;

    } catch (error) {
        if (coldStartTimer) clearTimeout(coldStartTimer);

        if (error instanceof Error) {
            // Abort error (timeout)
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. The AI engine took too long to respond. Please try again.');
            }
            // Network error or CORS issue
            if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                throw new Error('Network error: Cannot reach the AI backend. Please check your internet connection.');
            }
            throw error;
        }
        throw new Error('Unknown error occurred during simulation');
    }
}

/**
 * Check if backend is available (useful for showing cold start warning)
 */
export async function checkBackendHealth(): Promise<{ healthy: boolean; isColdStart: boolean }> {
    const startTime = Date.now();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s for health check

        const response = await fetch(`${SIMULATION_API_URL}/`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        return {
            healthy: response.ok,
            isColdStart: duration > 5000 // If it took more than 5s, it was a cold start
        };
    } catch {
        return { healthy: false, isColdStart: true };
    }
}

/**
 * Get the current backend URL (for debugging)
 */
export function getBackendUrl(): string {
    return SIMULATION_API_URL;
}
