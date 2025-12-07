import React, { useEffect, useState } from 'react';
import { ICONS } from '../constants';
import { mockService } from '../services/mockService';
import { AnalyticsData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AnalyticsProps {
  onClose: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ onClose }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockService.getAnalytics().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ICONS.Analytics className="text-blue-600" />
            Dashboard Analytics
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ICONS.Close className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : data ? (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-600">Active Users</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{data.activeUsers}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                  <p className="text-sm font-medium text-green-600">Total Messages</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{data.totalMessages}</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                  <p className="text-sm font-medium text-purple-600">Server Status</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">Healthy</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Message Traffic (Last 6 Hours)</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.messagesPerHour}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="hour" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
             <p className="text-center text-slate-500">Failed to load data</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
