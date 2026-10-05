import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { STATUS_CONFIG } from '../constants';

const STAGE_COLORS = {
  IDEA:     '#94a3b8',
  SHOOTING: '#eab308',
  EDITING:  '#3b82f6',
  READY:    '#22c55e',
  POSTED:   '#6C5CE7',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-[#1a1a1e] border border-white/10 rounded-2xl px-4 py-2.5 shadow-2xl">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{name}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
};

const StageStats = ({ projects }) => {
  const data = useMemo(() =>
    Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
      name:  cfg.label,
      key,
      value: projects.filter(p => p.status === key).length,
      color: STAGE_COLORS[key],
    })),
  [projects]);

  const total = projects.length;
  const activeCount = projects.filter(p => p.status !== 'POSTED').length;

  return (
    <div className="mb-10">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-4 rounded-full bg-violet-500/60" />
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Stage Overview</h3>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 lg:w-48 lg:shrink-0">
          {data.map(({ key, name, value, color }) => (
            <div
              key={key}
              className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 hover:bg-white/[0.055] transition-colors group"
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{name}</p>
                <p className="text-xl font-black text-white leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Donut chart */}
        <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-[24px] p-5 flex items-center justify-center min-h-[220px] relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map(({ key, color, value }) => (
                  <Cell
                    key={key}
                    fill={value === 0 ? 'transparent' : color}
                    opacity={value === 0 ? 0 : 1}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-white">{total}</span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-0.5">Total</span>
            {activeCount > 0 && (
              <span className="text-[8px] font-bold text-violet-400 mt-1">{activeCount} active</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageStats;
