import React from 'react';
import House from './House';

const NetworkView = ({ sensorData, predictions, compact = false }) => {
  if (!sensorData || !sensorData.houses) {
    return null;
  }

  const houses = sensorData.houses;
  const zones = [];
  
  // Group houses into 5 zones (10 houses each)
  for (let i = 0; i < 5; i++) {
    zones.push(houses.slice(i * 10, (i + 1) * 10));
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg" data-testid="network-view">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Village Network - 50 Houses</h2>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm" data-testid="network-legend">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span>Leak Detected</span>
        </div>
      </div>

      {/* Zones */}
      <div className="space-y-8">
        {zones.map((zoneHouses, zoneIndex) => (
          <div key={zoneIndex} data-testid={`zone-${zoneIndex + 1}`}>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Zone {zoneIndex + 1}</h3>
            <div className={`grid gap-4 ${
              compact ? 'grid-cols-5 md:grid-cols-10' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10'
            }`}>
              {zoneHouses.map((house, idx) => {
                const houseId = zoneIndex * 10 + idx;
                const prediction = predictions ? predictions[houseId] : null;
                return (
                  <House 
                    key={houseId}
                    houseId={houseId + 1}
                    pressure={house.pressure}
                    flowRate={house.flow_rate}
                    temperature={house.temperature}
                    prediction={prediction}
                    compact={compact}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkView;
