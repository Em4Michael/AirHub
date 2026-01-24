'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { adminApi } from '@/lib/api/admin.api';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

export default function AdminRankingsPage() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const response = await adminApi.getRankedProfiles();
      if (response.success && response.data) {
        setRankings(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Performance Rankings</h1>
        <p className="text-gray-600 mt-1">Top performing profiles</p>
      </div>

      {error && <Alert type="error" message={error} />}

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No ranking data available</p>
          ) : (
            <div className="space-y-3">
              {rankings.map((item, index) => (
                <div
                  key={item._id || index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100">
                      {index === 0 ? (
                        <Trophy className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <span className="font-bold text-primary-600">#{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{item.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={index < 3 ? 'success' : 'primary'}>
                      Score: {item.score || 0}
                    </Badge>
                    {item.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}