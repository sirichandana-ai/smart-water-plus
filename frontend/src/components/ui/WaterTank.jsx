import React from 'react';
import { Droplets } from 'lucide-react';

const WaterTank = ({ tankLevel }) => {
  const level = Math.max(0, Math.min(100, tankLevel));
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg" data-testid="water-tank">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Water Tank Status</h2>
      
      <div className="flex flex-col items-center">
        {/* Tank Container */}
        <div className="relative w-48 h-80 bg-gray-100 rounded-2xl border-4 border-gray-300 overflow-hidden shadow-inner">
          {/* Water Level */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-cyan-400 water-wave transition-all duration-1000"
            style={{ height: `${level}%` }}
            data-testid="tank-water-level"
          >
            {/* Wave effect */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-blue-500 opacity-30 rounded-full"></div>
          </div>
          
          {/* Level markers */}
          <div className="absolute inset-0 flex flex-col justify-between py-4 px-2">
            {[100, 75, 50, 25, 0].map((mark) => (
              <div key={mark} className="flex items-center">
                <div className="w-2 h-px bg-gray-400"></div>
                <span className="text-xs text-gray-500 ml-2">{mark}%</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Level Display */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Droplets className="w-6 h-6 text-blue-500" />
            <span className="text-4xl font-bold text-gray-800" data-testid="tank-level-percentage">{level.toFixed(1)}%</span>
          </div>
          <p className="text-gray-600 text-sm">Current Tank Level</p>
          
          {level < 30 && (
            <div className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm" data-testid="low-level-warning">
              ⚠️ Low water level - refill needed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaterTank;
