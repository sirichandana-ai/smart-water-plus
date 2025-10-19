import React from 'react';
import { Calendar } from 'lucide-react';

const ScheduleOptimizer = ({ schedule }) => {
  if (!schedule || !schedule.allocations) {
    return null;
  }

  const allocations = schedule.allocations;
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg" data-testid="schedule-optimizer">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Water Allocation Schedule</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">House #</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Allocation (L)</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((allocation, idx) => {
              const isUnderSupplied = allocation < 100;
              return (
                <tr 
                  key={idx} 
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isUnderSupplied ? 'bg-yellow-50' : ''
                  }`}
                  data-testid={`allocation-row-${idx + 1}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">House #{idx + 1}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {allocation.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isUnderSupplied ? (
                      <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                        Under-supplied
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 rounded"></div>
            <span className="text-gray-600">Normal Supply</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 rounded"></div>
            <span className="text-gray-600">Under-supplied (&lt; 100L)</span>
          </div>
        </div>
        <div className="text-gray-600" data-testid="total-allocation">
          Total: <span className="font-bold text-gray-900">
            {allocations.reduce((sum, val) => sum + val, 0).toFixed(2)} L
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleOptimizer;
