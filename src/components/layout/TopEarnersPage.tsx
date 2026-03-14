'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import {
  ChevronLeft, ChevronRight, Trophy, Clock,
  TrendingUp, Star, Users, Eye,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Earner {
  rank:          number;
  userId:        string;
  name:          string;
  hours:         number;
  earnings:      number;
  entryCount:    number;
  isCurrentUser: boolean;
}

interface AvailableWeek {
  weekStart:  string;
  weekEnd:    string;
  weekNumber: number;
  year:       number;
}

interface TopEarnersData {
  weekStart:        string;
  weekEnd:          string;
  earners:          Earner[];
  currentUserEntry: Earner | null;
  totalWorkers:     number;
  availableWeeks:   AvailableWeek[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MEDAL = {
  1: { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', border: '#f59e0b', emoji: '🥇' },
  2: { bg: 'linear-gradient(135deg,#94a3b8,#64748b)', border: '#94a3b8', emoji: '🥈' },
  3: { bg: 'linear-gradient(135deg,#cd7c2f,#a0522d)', border: '#cd7c2f', emoji: '🥉' },
} as Record<number, { bg: string; border: string; emoji: string }>;

const AVATAR_PALETTE = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f59e0b','#10b981','#06b6d4','#3b82f6',
];
const avatarBg = (name: string) =>
  AVATAR_PALETTE[(name.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

const initials = (name: string) => {
  const p = name.trim().split(' ');
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : (name[0] ?? '?').toUpperCase();
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 40, rank }: { name: string; size?: number; rank?: number }) {
  const medal = rank ? MEDAL[rank] : null;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center font-bold select-none text-white"
        style={{
          background:  medal ? medal.bg : avatarBg(name),
          fontSize:    size * 0.35,
          boxShadow:   medal ? `0 0 0 3px ${medal.border}55` : undefined,
        }}
      >
        {initials(name)}
      </div>
      {medal && (
        <span
          className="absolute -bottom-1 -right-1 leading-none"
          style={{ fontSize: size * 0.3 }}
        >
          {medal.emoji}
        </span>
      )}
    </div>
  );
}

// ─── Your Position Card — always visible ─────────────────────────────────────

function YourPositionCard({
  entry,
  totalWorkers,
  isAdmin,
  userName,
}: {
  entry:        Earner | null;
  totalWorkers: number;
  isAdmin:      boolean;
  userName:     string;
}) {
  if (isAdmin && !entry) {
    // Admin/superadmin observing — they are not in the earner list
    return (
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
        >
          <Eye className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Viewing as Admin
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Admins are not included in the worker leaderboard
          </p>
        </div>
      </div>
    );
  }

  if (!entry) {
    // Worker with no approved entries this week
    return (
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
        >
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Not ranked this week
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            No approved entries recorded yet — check back after your entries are vetted
          </p>
        </div>
      </div>
    );
  }

  const medal = MEDAL[entry.rank];
  const pct   = totalWorkers > 1 ? ((totalWorkers - entry.rank) / (totalWorkers - 1)) * 100 : 100;

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg,
          color-mix(in srgb, var(--accent-color) 18%, var(--bg-secondary)),
          var(--bg-secondary))`,
        border: '2px solid var(--accent-color)',
        boxShadow: '0 4px 24px color-mix(in srgb, var(--accent-color) 20%, transparent)',
      }}
    >
      {/* "YOUR RANKING" label */}
      <p
        className="text-[10px] font-black uppercase tracking-widest mb-3"
        style={{ color: 'var(--accent-color)' }}
      >
        Your Position This Week
      </p>

      <div className="flex items-center gap-4">
        {/* Big rank number */}
        <div
          className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
          style={{
            background:  medal ? medal.bg : 'var(--accent-color)',
            boxShadow:   medal ? `0 4px 16px ${medal.border}44` : undefined,
          }}
        >
          <span className="text-2xl font-black text-white leading-none">
            #{entry.rank}
          </span>
          {medal && (
            <span className="text-lg leading-none">{medal.emoji}</span>
          )}
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-lg truncate" style={{ color: 'var(--text-primary)' }}>
            {userName}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
            <span className="text-sm font-semibold" style={{ color: 'var(--accent-color)' }}>
              {formatCurrency(entry.earnings)}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {entry.hours.toFixed(1)}h · {entry.entryCount} entries
            </span>
          </div>

          {/* Progress bar: position relative to all workers */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              {/* "Ranked X of Y" — the core ask */}
              <span
                className="text-xs font-black"
                style={{ color: 'var(--text-primary)' }}
              >
                Ranked&nbsp;
                <span style={{ color: 'var(--accent-color)' }}>{entry.rank}</span>
                <span style={{ color: 'var(--text-muted)' }}> of {totalWorkers}</span>
              </span>

              {/* Top N% pill */}
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: medal ? medal.bg : 'var(--accent-color)',
                  color: '#fff',
                }}
              >
                Top {Math.max(1, Math.round((entry.rank / Math.max(totalWorkers, 1)) * 100))}%
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${pct}%`,
                  background: medal ? medal.bg : 'var(--accent-color)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Podium card (top 3) ──────────────────────────────────────────────────────

function PodiumCard({ earner, isMe }: { earner: Earner; isMe: boolean }) {
  const medal   = MEDAL[earner.rank];
  const offsets = { 1: 'pb-0', 2: 'pb-5', 3: 'pb-9' } as Record<number, string>;

  return (
    <div className={`flex flex-col items-center gap-2 flex-1 min-w-0 ${offsets[earner.rank] ?? 'pb-9'}`}>
      <Avatar name={earner.name} size={earner.rank === 1 ? 60 : 48} rank={earner.rank} />

      <div
        className="w-full rounded-2xl p-3 text-center relative overflow-hidden"
        style={{
          background:  isMe
            ? `linear-gradient(160deg, color-mix(in srgb, var(--accent-color) 18%, var(--bg-secondary)), var(--bg-secondary))`
            : 'var(--bg-secondary)',
          border: `2px solid ${isMe ? 'var(--accent-color)' : medal.border + '55'}`,
          boxShadow: earner.rank === 1 ? `0 6px 28px ${medal.border}33` : undefined,
        }}
      >
        {isMe && (
          <span
            className="absolute top-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}
          >
            YOU
          </span>
        )}

        <p
          className="font-bold text-sm truncate"
          style={{ color: 'var(--text-primary)' }}
          title={earner.name}
        >
          {earner.name.split(' ')[0]}
        </p>

        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {earner.hours.toFixed(1)}h
        </p>

        <p
          className="text-base font-black mt-1.5"
          style={{
            background:              medal.bg,
            WebkitBackgroundClip:    'text',
            WebkitTextFillColor:     'transparent',
          }}
        >
          {formatCurrency(earner.earnings)}
        </p>
      </div>
    </div>
  );
}

// ─── Row (rank 4+) ────────────────────────────────────────────────────────────

function EarnerRow({ earner, isMe }: { earner: Earner; isMe: boolean }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        backgroundColor: isMe
          ? 'color-mix(in srgb, var(--accent-color) 10%, var(--bg-secondary))'
          : 'var(--bg-secondary)',
        border: `1px solid ${isMe ? 'var(--accent-color)' : 'var(--border-color)'}`,
      }}
    >
      <span
        className="text-sm font-black w-7 text-center flex-shrink-0 tabular-nums"
        style={{ color: isMe ? 'var(--accent-color)' : 'var(--text-muted)' }}
      >
        {earner.rank}
      </span>

      <Avatar name={earner.name} size={34} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {earner.name}
          </p>
          {isMe && (
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}
            >
              YOU
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {earner.hours.toFixed(1)}h · {earner.entryCount} entries
        </p>
      </div>

      <p
        className="text-sm font-black flex-shrink-0 tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {formatCurrency(earner.earnings)}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TopEarnersPage() {
  const { user } = useAuth();

  const isAdmin =
    user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN;

  // Admin/superadmin call /admin/top-earners; workers call /user/top-earners
  const apiBase = isAdmin ? '/admin/top-earners' : '/user/top-earners';

  const [data,    setData]    = useState<TopEarnersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [weekIdx, setWeekIdx] = useState(0);
  const [weeks,   setWeeks]   = useState<AvailableWeek[]>([]);

  const fetchEarners = useCallback(async (weekStart?: string) => {
    try {
      setLoading(true);
      setError('');
      const params = weekStart ? { weekStart } : {};
      const res    = await apiClient.get(apiBase, { params });
      const body   = res.data;

      if (body.success && body.data) {
        setData(body.data);
        if (body.data.availableWeeks?.length && weekStart === undefined) {
          // Only overwrite the week list on initial load
          setWeeks(body.data.availableWeeks);
        }
      } else {
        setError('Could not load leaderboard.');
      }
    } catch {
      setError('Failed to load top earners.');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => { fetchEarners(); }, [fetchEarners]);

  const currentMeta = weeks[weekIdx];
  const isCurrentWeek = weekIdx === 0;

  const goBack = () => {
    const next = Math.min(weekIdx + 1, weeks.length - 1);
    setWeekIdx(next);
    fetchEarners(weeks[next]?.weekStart);
  };
  const goForward = () => {
    const next = Math.max(weekIdx - 1, 0);
    setWeekIdx(next);
    fetchEarners(weeks[next]?.weekStart);
  };

  const top3    = data?.earners.slice(0, 3) ?? [];
  const rest    = data?.earners.slice(3)    ?? [];
  const meEntry = data?.currentUserEntry ?? null;

  return (
    <div className="space-y-5 pb-20 lg:pb-8">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Top Earners
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Ranked by weekly earnings · flat rate · no multiplier
          </p>
        </div>

        {/* Week picker */}
        <div
          className="flex items-center gap-1 rounded-2xl p-1 self-start"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border:          '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={goBack}
            disabled={weekIdx >= weeks.length - 1 || loading}
            className="p-2 rounded-xl transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center min-w-[148px] px-1">
            {isCurrentWeek && (
              <p
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: 'var(--accent-color)' }}
              >
                Current Week
              </p>
            )}
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {currentMeta
                ? `${fmtDate(currentMeta.weekStart)} – ${fmtDate(currentMeta.weekEnd)}`
                : data
                ? `${fmtDate(data.weekStart)} – ${fmtDate(data.weekEnd)}`
                : '—'}
            </p>
            {currentMeta && (
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Wk {currentMeta.weekNumber}, {currentMeta.year}
              </p>
            )}
          </div>

          <button
            onClick={goForward}
            disabled={weekIdx <= 0 || loading}
            className="p-2 rounded-xl transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
          <button
            onClick={() => fetchEarners(weeks[weekIdx]?.weekStart)}
            className="mt-3 text-sm font-semibold"
            style={{ color: 'var(--accent-color)' }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* ── YOUR POSITION — always first, always visible ─────────────────── */}
          {/*
           * totalWorkers = data.earners.length (the actual number of ranked
           * workers this week). This is the authoritative count used everywhere:
           * the "Xth of Y" label, the progress bar percentage, and the stats strip.
           */}
          <YourPositionCard
            entry={meEntry}
            totalWorkers={data.earners.length}
            isAdmin={isAdmin}
            userName={user?.name ?? 'You'}
          />

          {/* ── Empty state ───────────────────────────────────────────────────── */}
          {data.earners.length === 0 && (
            <div
              className="rounded-2xl p-12 text-center"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border:          '1px solid var(--border-color)',
              }}
            >
              <Trophy
                className="w-12 h-12 mx-auto mb-3 opacity-20"
                style={{ color: 'var(--text-muted)' }}
              />
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                No earnings recorded yet for this week
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Check back once entries have been approved and payments generated
              </p>
            </div>
          )}

          {data.earners.length > 0 && (
            <>
              {/* ── Stats strip ─────────────────────────────────────────────── */}
              <div className="grid grid-cols-3 gap-3">
                {/* Ranked card — custom render for position display */}
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{
                    backgroundColor: meEntry
                      ? 'color-mix(in srgb, var(--accent-color) 8%, var(--bg-secondary))'
                      : 'var(--bg-secondary)',
                    border: meEntry
                      ? '1px solid color-mix(in srgb, var(--accent-color) 40%, var(--border-color))'
                      : '1px solid var(--border-color)',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-color)' }}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ranked</p>
                  {meEntry ? (
                    // Worker with a rank — show "5 of 27"
                    <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                      <span
                        className="text-base font-black tabular-nums leading-none"
                        style={{ color: 'var(--accent-color)' }}
                      >
                        {meEntry.rank}
                      </span>
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        &nbsp;of {data.earners.length}
                      </span>
                    </div>
                  ) : (
                    // Admin or worker with no entries — show total
                    <p
                      className="text-sm font-bold mt-0.5 tabular-nums"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {data.earners.length}
                    </p>
                  )}
                  {meEntry && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      this week
                    </p>
                  )}
                </div>

                {/* Total Hours */}
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-color)' }}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Hours</p>
                  <p className="text-sm font-bold mt-0.5 tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {data.earners.reduce((s, e) => s + e.hours, 0).toFixed(1)}h
                  </p>
                </div>

                {/* Top Earning */}
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-color)' }}
                  >
                    <Star className="w-4 h-4" />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Top Earning</p>
                  <p className="text-sm font-bold mt-0.5 tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(data.earners[0]?.earnings ?? 0)}
                  </p>
                </div>
              </div>

              {/* ── Podium — top 3, centre layout: [2nd, 1st, 3rd] ─────────── */}
              {top3.length > 0 && (
                <div>
                  <p
                    className="text-[11px] font-black uppercase tracking-widest mb-3"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Top 3
                  </p>
                  <div className="flex items-end gap-3">
                    {([ top3[1] ?? null, top3[0] ?? null, top3[2] ?? null ] as (Earner | null)[])
                      .map((e, i) =>
                        e ? (
                          <PodiumCard key={e.userId} earner={e} isMe={e.isCurrentUser} />
                        ) : (
                          <div key={`empty-${i}`} className="flex-1" />
                        )
                      )}
                  </div>
                </div>
              )}

              {/* ── Runners-up list ─────────────────────────────────────────── */}
              {rest.length > 0 && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                    <span
                      className="text-[11px] font-black uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Runners-up
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                  </div>
                  <div className="space-y-2">
                    {rest.map((earner) => (
                      <EarnerRow
                        key={earner.userId}
                        earner={earner}
                        isMe={earner.isCurrentUser}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}