import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const LeakAlerts = ({ predictions, sensorData }) => {
  if (!predictions) {
    return null;
  }

  const leaks = predictions.filter((p, idx) => {
    return p.rf_prediction === 1 || p.lr_prediction === 1;
  }).map((p, idx) => {
    const houseId = predictions.indexOf(p) + 1;
    const house = sensorData?.houses ? sensorData.houses[houseId - 1] : null;
    return { ...p, houseId, house };
  });

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg" data-testid="leak-alerts">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Leak Detection Alerts</h2>
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold" data-testid="leak-count">
          {leaks.length} Active Leak{leaks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {leaks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12" data-testid="no-leaks">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <p className="text-lg text-gray-600">All systems normal - No leaks detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaks.map((leak, idx) => (
            <div 
              key={idx} 
              className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg slide-up"
              data-testid={`leak-alert-${leak.houseId}`}
            >
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-red-800">House #{leak.houseId}</h3>
                    <span className="text-sm text-red-600 font-semibold">LEAK DETECTED</span>
                  </div>
                  
                  {leak.house && (
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm text-gray-700">
                      <div>
                        <span className="text-gray-500">Pressure:</span>
                        <span className="font-semibold ml-2">{leak.house.pressure.toFixed(2)} bar</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Flow:</span>
                        <span className="font-semibold ml-2">{leak.house.flow_rate.toFixed(1)} L/s</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Temp:</span>
                        <span className="font-semibold ml-2">{leak.house.temperature.toFixed(1)}°C</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4 text-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-white px-3 py-2 rounded-md cursor-help" data-testid={`rf-prediction-${leak.houseId}`}>
                            <span className="text-gray-600">RF Model:</span>
                            <span className={`ml-2 font-bold ${leak.rf_prediction === 1 ? 'text-red-600' : 'text-green-600'}`}>
                              {leak.rf_prediction === 1 ? 'LEAK' : 'OK'}
                            </span>
                            <span className="ml-2 text-gray-500">({(leak.rf_probability * 100).toFixed(1)}%)</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Random Forest Model Prediction</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-white px-3 py-2 rounded-md cursor-help" data-testid={`lr-prediction-${leak.houseId}`}>
                            <span className="text-gray-600">LR Model:</span>
                            <span className={`ml-2 font-bold ${leak.lr_prediction === 1 ? 'text-red-600' : 'text-green-600'}`}>
                              {leak.lr_prediction === 1 ? 'LEAK' : 'OK'}
                            </span>
                            <span className="ml-2 text-gray-500">({(leak.lr_probability * 100).toFixed(1)}%)</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Logistic Regression Model Prediction</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeakAlerts;
