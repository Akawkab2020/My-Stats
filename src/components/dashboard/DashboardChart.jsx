import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import Card from '../ui/Card';
import { BarChart3 } from 'lucide-react';

const data = [
  { name: 'يناير', spending: 12500 },
  { name: 'فبراير', spending: 18900 },
  { name: 'مارس', spending: 14800 },
  { name: 'أبريل', spending: 21500 },
  { name: 'مايو', spending: 23800 },
  { name: 'يونيو', spending: 29500 },
];

const DashboardChart = () => {
  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <BarChart3 size={18} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>تحليل المنصرف الشهري</h2>
        </div>
        
        <select className="neu-select py-1.5 px-3 text-xs w-auto">
          <option>آخر 6 شهور</option>
          <option>آخر سنة</option>
        </select>
      </div>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              tickFormatter={(value) => `${value.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-bg-card)', 
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-premium)',
                fontSize: '13px'
              }}
              itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
              labelStyle={{ color: 'var(--color-text)', marginBottom: '4px', fontWeight: 'bold' }}
              formatter={(value) => [`${value.toLocaleString()} ج.م`, 'المبلغ']}
            />
            <Area 
              type="monotone" 
              dataKey="spending" 
              stroke="var(--color-primary)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSpending)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-primary)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default DashboardChart;
