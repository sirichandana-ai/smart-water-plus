import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

const DemandForecast = ({ forecast }) => {
  if (!forecast || !forecast.forecast) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg" data-testid="demand-forecast">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Water Demand Forecast</h2>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Loading forecast data...</p>
        </div>
      </div>
    );
  }

  // Transform data for recharts
  const chartData = forecast.forecast.map((value, index) => ({
    hour: `${index}h`,
    demand: value
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg" data-testid="demand-forecast">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-cyan-600" />
        <h2 className="text-2xl font-bold text-gray-800">Water Demand Forecast</h2>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Next {forecast.forecast.length} hours prediction</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="hour" 
            stroke="#666"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#666"
            tick={{ fontSize: 12 }}
            label={{ value: 'Demand (L)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #ccc', 
              borderRadius: '8px',
              padding: '10px'
            }}
            formatter={(value) => [`${value.toFixed(2)} L`, 'Demand']}
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Line 
            type="monotone" 
            dataKey="demand" 
            stroke="#0891b2" 
            strokeWidth={3}
            dot={{ fill: '#0891b2', r: 4 }}
            activeDot={{ r: 6 }}
            name="Water Demand"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-cyan-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Avg Demand</p>
          <p className="text-lg font-bold text-cyan-700">
            {(forecast.forecast.reduce((a, b) => a + b, 0) / forecast.forecast.length).toFixed(2)} L
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Peak Demand</p>
          <p className="text-lg font-bold text-blue-700">
            {Math.max(...forecast.forecast).toFixed(2)} L
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Min Demand</p>
          <p className="text-lg font-bold text-green-700">
            {Math.min(...forecast.forecast).toFixed(2)} L
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemandForecast;
