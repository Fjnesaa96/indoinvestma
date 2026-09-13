import React from 'react';
import { Users, TrendingUp, Home, PieChart, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'jaringan', label: 'Jaringan', icon: Users },
    { id: 'market', label: 'Market', icon: TrendingUp },
    { id: 'beranda', label: 'Beranda', icon: Home, isCenter: true },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'profil', label: 'Profil', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3 pb-3">
      <nav className="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-3xl px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center -mt-5 transition-transform active:scale-95"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                    isActive
                      ? 'bg-[#0B1528] text-white shadow-[#0B1528]/30'
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  <Icon size={24} />
                </div>
                <span className="text-[11px] font-semibold mt-1 text-[#0B1528]">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center py-1 px-3 transition-colors active:scale-95"
            >
              <Icon
                size={20}
                className={isActive ? 'text-[#0B1528] stroke-[2.5]' : 'text-slate-400 stroke-[1.8]'}
              />
              <span
                className={`text-[11px] mt-1 ${
                  isActive ? 'text-[#0B1528] font-semibold' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
