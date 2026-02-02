import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Marketplace } from './pages/Marketplace';
import { AirQualityProvider } from './context/AirQualityContext';
import { EmailTracker } from './components/common/EmailTracker';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="*"
            element={
              <AirQualityProvider>
                <EmailTracker />
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                </Routes>
              </AirQualityProvider>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
