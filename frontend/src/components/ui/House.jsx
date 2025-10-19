import React, { useState } from 'react';
import { Home, Droplet, Gauge, Thermometer } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const House = ({ houseId, pressure, flowRate, temperature, prediction, compact = false }) => {
  // Determine leak status
  const hasLeak = prediction && (prediction.rf_prediction === 1 || prediction.lr_prediction === 1);
  const leakProbability = prediction ? Math.max(prediction.rf_probability, prediction.lr_probability) : 0;
  
  // Determine color based on leak probability
  let statusColor = 'bg-green-500';
  let borderColor = 'border-green-300';
  
  if (hasLeak) {
    statusColor = 'bg-red-500 leak-pulse';
    borderColor = 'border-red-400';
  } else if (leakProbability > 0.5) {
    statusColor = 'bg-yellow-500';
    borderColor = 'border-yellow-300';
  }

  const tooltipContent = (
    <div className="text-xs space-y-1">
      <div className="font-semibold mb-2">House #{houseId}</div>
      <div className="flex items-center gap-2">
        <Gauge className="w-3 h-3" />
        <span>Pressure: {pressure.toFixed(2)} bar</span>
      </div>
      <div className="flex items-center gap-2">
        <Droplet className="w-3 h-3" />
        <span>Flow: {flowRate.toFixed(1)} L/s</span>
      </div>
      <div className="flex items-center gap-2">
        <Thermometer className="w-3 h-3" />
        <span>Temp: {temperature.toFixed(1)}°C</span>
      </div>
      {prediction && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div>RF: {prediction.rf_prediction === 1 ? 'LEAK' : 'OK'} ({(prediction.rf_probability * 100).toFixed(1)}%)</div>
          <div>LR: {prediction.lr_prediction === 1 ? 'LEAK' : 'OK'} ({(prediction.lr_probability * 100).toFixed(1)}%)</div>
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`relative cursor-pointer transition-transform hover:scale-110`}
              data-testid={`house-${houseId}`}
            >
              <div className={`w-8 h-8 rounded-full ${statusColor} ${borderColor} border-2 flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{houseId}</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-800 text-white">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`bg-white rounded-lg p-4 border-2 ${borderColor} shadow-md hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1`}
            data-testid={`house-${houseId}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${statusColor.replace('leak-pulse', '')} bg-opacity-10`}>
                <Home className={`w-5 h-5 ${hasLeak ? 'text-red-600' : leakProbability > 0.5 ? 'text-yellow-600' : 'text-green-600'}`} />
              </div>
              <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
            </div>
            
            <div className="text-sm font-semibold text-gray-700 mb-2">House #{houseId}</div>
            
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                <span>{pressure.toFixed(2)} bar</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplet className="w-3 h-3" />
                <span>{flowRate.toFixed(1)} L/s</span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-800 text-white">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default House;
