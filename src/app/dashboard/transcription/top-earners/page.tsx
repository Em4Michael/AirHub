'use client';

// Route: /dashboard/transcription/top-earners/page.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { transcriptionApi, TranscriptionEarner } from '@/lib/api/transcription.api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { Award, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';

const MEDAL: Record<number, { bg: string; emoji: string }> = {
  1: { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', emoji: '🥇' },
  2: { bg: 'linear-gradient(135deg,#94a3b8,#64748b)', emoji: '🥈' },
  3: { bg: 'linear-gradient(135deg,#cd7c2f,#a0522d)', emoji: '🥉' },
};

const PALETTE = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#06b6d4','#3b82f6'];
const avatarBg = (name: string) => PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
const initials  = (name: string) => {
  const p = name?.trim().split(' ') ?? [];
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (name?.[0] ?? '?').toUpperCase();
};

/** Current ISO week number */
function currentISOWeek(): { week: number; year: number } {
  const d = new Date();
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: tmp.getUTCFullYear() };
}

export default function TranscriptionTopEarnersPage() {
  const { user } = useAuth();
  const { week: cw, year: cy } = currentISOWeek();

  const [week,    setWeek]    = useState(cw);
  const [year,    setYear]    = useState(cy);
  const [earners, setEarners] = useState<TranscriptionEarner[]>([]);
  const [meEntry, setMeEntry] = useState<TranscriptionEarner | null>(null);
  const [rate,    setRate]    = useState({ minutesPerTask: 10, ratePerHour: 2000 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const isCurrentWeek = week === cw && year === cy;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transcriptionApi.getTopEarners({ week, year });
      if (res.success && res.data) {
        setEarners(res.data.earners);
        setMeEntry(res.data.currentUserEntry);
        setRate({ minutesPerTask: res.data.minutesPerTask, ratePerHour: res.data.ratePerHour });
      }
    } catch { setError('Failed to load leaderboard'); }
    finally   { setLoading(false); }
  }, [week, year]);

  useEffect(() => { load(); }, [load]);

  const goPrev = () => {
    if (week === 1) { setWeek(52); setYear((y) => y - 1); }
    else setWeek((w) => w - 1);
  };
  const goNext = () => {
    if (isCurrentWeek) return;
    if (week >= 52) { setWeek(1); setYear((y) => y + 1); }
    else setWeek((w) => w + 1);
  };

  const top3 = earners.slice(0, 3);
  const rest = earners.slice(3);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Transcription Leaderboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Ranked by approved tasks · {rate.minutesPerTask} min/task · {formatCurrency(rate.ratePerHour)}/hr
          </p>
        </div>

        {/* Week picker */}
        <div className="flex items-center gap-1 rounded-2xl p-1 self-start"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <button onClick={goPrev} disabled={loading} className="p-2 rounded-xl disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center px-2 min-w-[140px]">
            {isCurrentWeek && (
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--accent-color)' }}>Current Week</p>
            )}
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Week {week} · {year}</p>
          </div>
          <button onClick={goNext} disabled={isCurrentWeek || loading} className="p-2 rounded-xl disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* My position */}
      {meEntry && (
        <div className="rounded-2xl p-5 border-2"
          style={{ borderColor: 'var(--accent-color)', background: `linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 15%, var(--bg-secondary)), var(--bg-secondary))` }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--accent-color)' }}>Your Position</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
              style={{ background: MEDAL[meEntry.rank]?.bg ?? 'var(--accent-color)' }}>
              <span className="text-xl font-black">#{meEntry.rank}</span>
            </div>
            <div className="flex-1">
              <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-sm" style={{ color: 'var(--accent-color)' }}>{formatCurrency(meEntry.earnings)}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{meEntry.tasks} tasks · {meEntry.sessions} sessions</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : earners.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <Award className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No data for Week {week} · {year}</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="flex items-end gap-3">
              {([top3[1] ?? null, top3[0] ?? null, top3[2] ?? null] as (TranscriptionEarner | null)[]).map((e, i) => {
                if (!e) return <div key={i} className="flex-1" />;
                const medal   = MEDAL[e.rank];
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
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{e.name.split(' ')[0]}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.tasks} tasks</p>
                      <p className="text-sm font-black mt-1" style={{ color: 'var(--accent-color)' }}>{formatCurrency(e.earnings)}</p>
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
                <div key={e.userId} className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{ backgroundColor: e.isCurrentUser ? 'color-mix(in srgb, var(--accent-color) 8%, var(--bg-secondary))' : 'var(--bg-secondary)', borderColor: e.isCurrentUser ? 'var(--accent-color)' : 'var(--border-color)' }}>
                  <span className="text-sm font-black w-6 text-center tabular-nums" style={{ color: e.isCurrentUser ? 'var(--accent-color)' : 'var(--text-muted)' }}>{e.rank}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: avatarBg(e.name) }}>
                    {initials(e.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {e.name}
                      {e.isCurrentUser && <span className="ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: 'var(--accent-color)' }}>YOU</span>}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.tasks} tasks · {e.sessions} sessions</p>
                  </div>
                  <p className="font-black text-sm tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatCurrency(e.earnings)}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
