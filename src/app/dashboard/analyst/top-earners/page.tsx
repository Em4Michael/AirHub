'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { analystApi } from '@/lib/api/analyst.api';
import { AnalystEarner } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { Award, ChevronLeft, ChevronRight, Clock, TrendingUp } from 'lucide-react';

const MONTH_NAMES = [
  '', 'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const MEDAL: Record<number, { bg: string; emoji: string }> = {
  1: { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', emoji: '🥇' },
  2: { bg: 'linear-gradient(135deg,#94a3b8,#64748b)', emoji: '🥈' },
  3: { bg: 'linear-gradient(135deg,#cd7c2f,#a0522d)', emoji: '🥉' },
};

const PALETTE = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#06b6d4','#3b82f6'];
const avatarBg = (name: string) => PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
const initials  = (name: string) => {
  const p = name?.trim().split(' ') ?? [];
  return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : (name?.[0] ?? '?').toUpperCase();
};

export default function AnalystTopEarnersPage() {
  const { user } = useAuth();
  const now = new Date();
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [year,    setYear]    = useState(now.getFullYear());
  const [earners, setEarners] = useState<AnalystEarner[]>([]);
  const [meEntry, setMeEntry] = useState<AnalystEarner | null>(null);
  const [rate,    setRate]    = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analystApi.getTopEarners({ month, year });
      if (res.success && res.data) {
        setEarners(res.data.earners);
        setMeEntry(res.data.currentUserEntry);
        setRate(res.data.hourlyRate);
      }
    } catch {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const top3 = earners.slice(0, 3);
  const rest = earners.slice(3);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            Analyst Leaderboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Ranked by approved hours · {formatCurrency(rate)}/hr
          </p>
        </div>

        {/* Month picker */}
        <div className="flex items-center gap-1 rounded-2xl p-1 self-start"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <button onClick={goPrev} disabled={loading}
            className="p-2 rounded-xl disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center px-2 min-w-[150px]">
            {isCurrentMonth && (
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--accent-color)' }}>
                Current Month
              </p>
            )}
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {MONTH_NAMES[month]} {year}
            </p>
          </div>
          <button onClick={goNext} disabled={isCurrentMonth || loading}
            className="p-2 rounded-xl disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* My position */}
      {meEntry && (
        <div className="rounded-2xl p-5 border-2"
          style={{
            borderColor:     'var(--accent-color)',
            background:      `linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 15%, var(--bg-secondary)), var(--bg-secondary))`,
          }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--accent-color)' }}>
            Your Position
          </p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
              style={{ background: MEDAL[meEntry.rank]?.bg ?? 'var(--accent-color)' }}>
              <span className="text-xl font-black">#{meEntry.rank}</span>
            </div>
            <div className="flex-1">
              <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-sm" style={{ color: 'var(--accent-color)' }}>{formatCurrency(meEntry.earnings)}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {meEntry.hours}h · {meEntry.sessions} sessions
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : earners.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <Award className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No data for {MONTH_NAMES[month]} {year}</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="flex items-end gap-3">
              {([top3[1] ?? null, top3[0] ?? null, top3[2] ?? null] as (AnalystEarner | null)[]).map((e, i) => {
                if (!e) return <div key={i} className="flex-1" />;
                const medal = MEDAL[e.rank];
                const offsets = ['pb-5', 'pb-0', 'pb-9'];
                return (
                  <div key={e.userId} className={`flex-1 flex flex-col items-center gap-2 ${offsets[i]}`}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ background: medal?.bg ?? avatarBg(e.name) }}>
                      {initials(e.name)}
                    </div>
                    <div className="w-full rounded-2xl p-3 text-center border-2"
                      style={{ borderColor: medal ? '#f59e0b55' : 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      <p className="text-lg">{medal?.emoji}</p>
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {e.name.split(' ')[0]}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.hours}h</p>
                      <p className="text-sm font-black mt-1" style={{ color: 'var(--accent-color)' }}>
                        {formatCurrency(e.earnings)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((e) => (
                <div key={e.userId}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: e.isCurrentUser
                      ? 'color-mix(in srgb, var(--accent-color) 8%, var(--bg-secondary))'
                      : 'var(--bg-secondary)',
                    borderColor: e.isCurrentUser ? 'var(--accent-color)' : 'var(--border-color)',
                  }}>
                  <span className="text-sm font-black w-6 text-center tabular-nums"
                    style={{ color: e.isCurrentUser ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                    {e.rank}
                  </span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: avatarBg(e.name) }}>
                    {initials(e.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {e.name}
                      {e.isCurrentUser && (
                        <span className="ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: 'var(--accent-color)' }}>YOU</span>
                      )}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {e.hours}h · {e.sessions} sessions
                    </p>
                  </div>
                  <p className="font-black text-sm tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(e.earnings)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}