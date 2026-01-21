# 🌬️ AirPulse

**Real-time, ward-level air pollution intelligence for everyone.**

AirPulse is a comprehensive air quality monitoring and analysis platform designed for Delhi NCR, providing actionable insights for citizens, authorities, and analysts.

![AirPulse Dashboard](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet)

---

## ✨ Features

### 🎭 Role-Based Dashboards

| Role | Description |
|------|-------------|
| **Citizen** | View real-time AQI, health advisories, and report local pollution sources |
| **Authority** | Monitor complaint hotspots, track resolution status, and manage teams |
| **Analyst** | Deep dive into pollution trends, source attribution, and predictive models |

### 🗺️ Interactive Ward-Level Map
- **272 Wards** of Delhi NCR with real-time AQI visualization
- Color-coded AQI categories (Good → Severe)
- Click-to-select ward interaction
- Choropleth mapping with GeoJSON boundaries

### 📊 Advanced Analytics (Analyst Mode)
- **Trend Charts** - Smooth curved line charts with gradient fills
- **Anomaly Detection** - Identify unusual pollution spikes
- **Predictive Models** - LSTM, Prophet, and Gradient Boosting forecasts
- **24-hour historical data** with mock data fallback

### 🧪 Policy Simulation Lab
Simulate the impact of policy interventions on ward-level AQI:

- **Traffic Diversion** (0-30% reduction)
- **Construction Dust Control** (0-40% reduction)
- **Biomass Burning Enforcement** (On/Off)
- **Weather Assistance** (Informational)

Features:
- Before/After AQI comparison
- Confidence scoring (Low/Medium/High)
- Time-based projections (24h, 48h)
- Export simulation reports

> ⚠️ *Simulated Inputs Only — No Real-World Enforcement*

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/MagicalMayank/AirPulse.git
cd AirPulse

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🏗️ Project Structure

```
airpulse/
├── public/
│   ├── Delhi_Wards_1.geojson   # Ward boundaries
│   ├── MCD_WARDS.csv           # Ward metadata
│   └── airpulse-logo.png       # Custom logo
├── src/
│   ├── components/
│   │   ├── dashboard/          # Dashboard panels
│   │   │   ├── InteractiveMap.tsx
│   │   │   ├── LeftPanel.tsx / AnalystLeftPanel.tsx
│   │   │   ├── RightPanel.tsx / AnalystRightPanel.tsx
│   │   │   ├── LineChart.tsx
│   │   │   ├── PolicySimulationLab.tsx
│   │   │   └── TrendChart.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── DashboardLayout.tsx
│   │   └── common/
│   │       └── RoleCard.tsx
│   ├── context/
│   │   └── AirQualityContext.tsx   # Global state management
│   ├── services/
│   │   └── openaq.ts               # OpenAQ API integration
│   ├── utils/
│   │   ├── aqiCalculator.ts        # AQI calculation logic
│   │   ├── simulationEngine.ts     # Policy simulation heuristics
│   │   └── wardMapping.ts          # Station-to-ward mapping
│   └── pages/
│       ├── Home.tsx                # Role selection landing
│       └── Dashboard.tsx           # Main dashboard
└── vite.config.ts
```

---

## 🔧 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Maps** | Leaflet + React-Leaflet |
| **Styling** | CSS Modules |
| **Icons** | Lucide React |
| **State** | React Context API |
| **API** | OpenAQ v3 |

---

## 📡 Data Sources

- **OpenAQ API** - Real-time air quality sensor data
- **Delhi Ward GeoJSON** - Administrative boundaries
- **Mock Data** - Fallback for demonstration when API unavailable

---

## 🎨 Design Features

- **Dark Theme** - Space-inspired UI with glassmorphism
- **Responsive** - Works on desktop and tablet
- **Smooth Animations** - Micro-interactions and transitions
- **Gradient Accents** - Purple → Cyan → Pink color scheme

---

## 🧮 Simulation Engine

The Policy Simulation Lab uses rule-based heuristics:

```
Source Contributions (Delhi NCR defaults):
├── Traffic: 35%
├── Construction: 25%
├── Burning: 20%
└── Weather: 20%

Impact Calculation:
reducedAQI = currentAQI × (1 - Σ(contribution × intervention × effectiveness))
```

Designed to be replaceable with ML models in the future.

---

## 📄 License

© 2026 AirPulse Smart City Initiative

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Contact

**Mayank** - [@MagicalMayank](https://github.com/MagicalMayank)

Project Link: [https://github.com/MagicalMayank/AirPulse](https://github.com/MagicalMayank/AirPulse)
