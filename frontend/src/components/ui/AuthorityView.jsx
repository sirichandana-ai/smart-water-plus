import React, { useState, useEffect } from 'react';
import WaterTank from './WaterTank';
import DemandForecast from './DemandForecast';
import NetworkView from './NetworkView';
import axios from 'axios';
import { AlertTriangle, Droplets, TrendingUp, AlertCircle } from 'lucide-react';

const FLASK_BASE_URL = 'http://localhost:5000';

// Mock data generator
const generateMockData = () => {
  const houses = [];
  for (let i = 0; i < 50; i++) {
    houses.push({
      pressure: (Math.random() * 4 + 1).toFixed(2) * 1,
      flow_rate: (Math.random() * 150 + 50).toFixed(1) * 1,
      temperature: (Math.random() * 20 + 10).toFixed(1) * 1
    });
  }
  
  const predictions = houses.map(() => {
    const hasLeak = Math.random() < 0.08;
    const rfProb = hasLeak ? Math.random() * 0.3 + 0.7 : Math.random() * 0.3;
    const lrProb = hasLeak ? Math.random() * 0.3 + 0.7 : Math.random() * 0.3;
    
    return {
      rf_prediction: hasLeak ? 1 : 0,
      rf_probability: rfProb,
      lr_prediction: hasLeak ? 1 : 0,
      lr_probability: lrProb
    };
  });
  
  const forecast = [];
  let baseValue = 120;
  for (let i = 0; i < 24; i++) {
    baseValue += (Math.random() - 0.5) * 20;
    forecast.push(Math.max(80, Math.min(200, baseValue)));
  }
  
  return {
    sensorData: { houses, tank_level: Math.random() * 40 + 60 },
    predictions,
    forecast: { forecast }
  };
};

const AuthorityView = () => {
  const [sensorData, setSensorData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchData = async () => {
    try {
      const sensorResponse = await axios.get(`${FLASK_BASE_URL}/simulate-data`, { timeout: 2000 });
      setSensorData(sensorResponse.data);

      const predictResponse = await axios.post(`${FLASK_BASE_URL}/predict`, sensorResponse.data, { timeout: 2000 });
      setPredictions(predictResponse.data);

      const forecastResponse = await axios.post(`${FLASK_BASE_URL}/forecast`, {}, { timeout: 2000 });
      setForecast(forecastResponse.data);

      setLoading(false);
      setIsDemo(false);
    } catch (error) {
      console.log('Flask backend not available, using demo data');
      const mockData = generateMockData();
      setSensorData(mockData.sensorData);
      setPredictions(mockData.predictions);
      setForecast(mockData.forecast);
      setLoading(false);
      setIsDemo(true);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 7000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-state">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading authority dashboard...</p>
        </div>
      </div>
    );
  }

  const totalLeaks = predictions ? predictions.filter(p => p.rf_prediction === 1 || p.lr_prediction === 1).length : 0;
  const tankLevel = sensorData?.tank_level || 75;
  const avgPressure = sensorData?.houses ? (sensorData.houses.reduce((sum, h) => sum + h.pressure, 0) / sensorData.houses.length).toFixed(2) : 0;

  return (
    <div className="space-y-6" data-testid="authority-dashboard">
      {isDemo && (
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-lg flex items-start gap-3" data-testid="demo-mode-banner">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Demo Mode Active</p>
            <p className="text-sm text-amber-700 mt-1">
              Flask backend not detected at localhost:5000. Showing simulated data. Start your Flask backend to see real-time data.
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100" data-testid="total-leaks-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Leaks Detected</p>
              <h3 className="text-3xl font-bold text-red-500 mt-2" data-testid="total-leaks-count">{totalLeaks}</h3>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100" data-testid="tank-level-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tank Level</p>
              <h3 className="text-3xl font-bold text-blue-500 mt-2" data-testid="tank-level-value">{tankLevel.toFixed(1)}%</h3>
            </div>
            <Droplets className="w-12 h-12 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100" data-testid="avg-pressure-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Pressure</p>
              <h3 className="text-3xl font-bold text-cyan-600 mt-2" data-testid="avg-pressure-value">{avgPressure} bar</h3>
            </div>
            <TrendingUp className="w-12 h-12 text-cyan-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaterTank tankLevel={tankLevel} />
        <DemandForecast forecast={forecast} />
      </div>

      <NetworkView sensorData={sensorData} predictions={predictions} compact={true} />
    </div>
  );
};

export default AuthorityView;
