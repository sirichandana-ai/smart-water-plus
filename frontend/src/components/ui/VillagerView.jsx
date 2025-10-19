import React, { useState, useEffect } from 'react';
import NetworkView from './NetworkView';
import LeakAlerts from './LeakAlerts';
import ScheduleOptimizer from './ScheduleOptimizer';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';

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
  
  const predictions = houses.map((house, idx) => {
    const hasLeak = Math.random() < 0.08; // 8% leak probability
    const rfProb = hasLeak ? Math.random() * 0.3 + 0.7 : Math.random() * 0.3;
    const lrProb = hasLeak ? Math.random() * 0.3 + 0.7 : Math.random() * 0.3;
    
    return {
      rf_prediction: hasLeak ? 1 : 0,
      rf_probability: rfProb,
      lr_prediction: hasLeak ? 1 : 0,
      lr_probability: lrProb
    };
  });
  
  const allocations = houses.map(() => Math.random() * 100 + 80);
  
  return {
    sensorData: { houses, tank_level: Math.random() * 40 + 60 },
    predictions,
    schedule: { allocations }
  };
};

const VillagerView = () => {
  const [sensorData, setSensorData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Fetch data from Flask backend
  const fetchData = async () => {
    try {
      const sensorResponse = await axios.get(`${FLASK_BASE_URL}/simulate-data`, { timeout: 2000 });
      setSensorData(sensorResponse.data);

      const predictResponse = await axios.post(`${FLASK_BASE_URL}/predict`, sensorResponse.data, { timeout: 2000 });
      setPredictions(predictResponse.data);

      const scheduleResponse = await axios.post(`${FLASK_BASE_URL}/schedule`, {}, { timeout: 2000 });
      setSchedule(scheduleResponse.data);

      setLoading(false);
      setIsDemo(false);
    } catch (error) {
      console.log('Flask backend not available, using demo data');
      // Use mock data
      const mockData = generateMockData();
      setSensorData(mockData.sensorData);
      setPredictions(mockData.predictions);
      setSchedule(mockData.schedule);
      setLoading(false);
      setIsDemo(true);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 7 seconds
    const interval = setInterval(fetchData, 7000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-state">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading water management data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="villager-dashboard">
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
      
      <NetworkView sensorData={sensorData} predictions={predictions} />
      <LeakAlerts predictions={predictions} sensorData={sensorData} />
      <ScheduleOptimizer schedule={schedule} />
    </div>
  );
};

export default VillagerView;
