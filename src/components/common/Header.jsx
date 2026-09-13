import React from 'react';
import { Bell, Headphones } from 'lucide-react';

export default function Header({ onOpenCS }) {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* Brand Identity */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#E5A93C] flex items-center justify-center font-black text-[#0B1528] text-sm shadow-sm">
          IN
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-white leading-none">
            IndoInvestma
          </h1>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Market Access
          </p>
        </div>
      </div>

      {/* Quick Action Icons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCS}
          className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/15 active:scale-95 transition-all"
          title="Layanan CS"
        >
          <Headphones size={17} />
        </button>
        <button
          className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/15 active:scale-95 transition-all relative"
          title="Notifikasi"
        >
          <Bell size={17} />
          <span className="w-2 h-2 rounded-full bg-[#E5A93C] absolute top-1.5 right-1.5 ring-2 ring-[#0B1528]" />
        </button>
      </div>
    </div>
  );
}
