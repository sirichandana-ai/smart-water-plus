import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import VillagerView from './VillagerView';
import AuthorityView from './AuthorityView';
import { Droplets } from 'lucide-react';

const Dashboard = () => {
  const [activeView, setActiveView] = useState('villager');

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                <Droplets className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800" style={{fontFamily: 'Inter'}}>Smart Water Management</h1>
                <p className="text-gray-600 text-base mt-1">Real-time monitoring & leak detection system</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto mb-8 bg-white shadow-md" data-testid="view-tabs">
            <TabsTrigger 
              value="villager" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              data-testid="villager-tab"
            >
              Villager View
            </TabsTrigger>
            <TabsTrigger 
              value="authority" 
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              data-testid="authority-tab"
            >
              Authority View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="villager" data-testid="villager-view">
            <VillagerView />
          </TabsContent>

          <TabsContent value="authority" data-testid="authority-view">
            <AuthorityView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
