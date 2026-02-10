
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DonationStats } from '../types';

interface DashboardProps {
  stats: DonationStats;
}

const COLORS = ['#0D9488', '#0891B2', '#0284C7', '#2563EB', '#4F46E5'];

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100 flex flex-col items-center justify-center">
          <span className="text-teal-600 text-sm font-semibold uppercase tracking-wider mb-2">총 기부 금액</span>
          <span className="text-3xl font-bold text-gray-800">₩ {stats.totalAmount.toLocaleString()}</span>
          <p className="text-xs text-gray-500 mt-2">목표 달성률: 85%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center">
          <span className="text-emerald-600 text-sm font-semibold uppercase tracking-wider mb-2">에코 임팩트</span>
          <span className="text-3xl font-bold text-gray-800">{stats.treeEquivalents} 그루</span>
          <p className="text-xs text-gray-500 mt-2">자원 재활용을 통한 효과</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col items-center justify-center">
          <span className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-2">도움을 받은 이웃</span>
          <span className="text-3xl font-bold text-gray-800">{stats.beneficiariesCount} 명</span>
          <p className="text-xs text-gray-500 mt-2">3개 협력 NGO를 통해 전달</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <span className="bg-teal-100 p-2 rounded-lg mr-3">🏆</span>
          팀별 기부 랭킹
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.teamRankings} layout="vertical" margin={{ left: 40, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="team" 
                stroke="#6B7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`₩ ${value.toLocaleString()}`, '기부액']}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                {stats.teamRankings.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
