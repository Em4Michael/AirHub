'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { superadminApi } from '@/lib/api/superadmin.api';
import { Benchmark } from '@/types';
import { formatDate } from '@/lib/utils/format';
import { Plus, CheckCircle } from 'lucide-react';

export default function BenchmarksPage() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  const fetchBenchmarks = async () => {
    try {
      const response = await superadminApi.getAllBenchmarks();
      if (response.success && response.data) {
        setBenchmarks(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load benchmarks');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Benchmarks</h1>
          <p className="text-gray-600 mt-1">Manage performance benchmarks</p>
        </div>
        <Button>
          <Plus className="w-5 h-5 mr-2" />
          Create Benchmark
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid gap-6">
        {benchmarks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No benchmarks found. Create your first benchmark!
            </CardContent>
          </Card>
        ) : (
          benchmarks.map((benchmark) => (
            <Card key={benchmark._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {formatDate(benchmark.startDate)} - {formatDate(benchmark.endDate)}
                  </CardTitle>
                  {benchmark.isActive && (
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Benchmarks</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{benchmark.timeBenchmark}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quality:</span>
                        <span className="font-medium">{benchmark.qualityBenchmark}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Thresholds</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Excellent:</span>
                        <span className="font-medium">{benchmark.thresholds.excellent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Good:</span>
                        <span className="font-medium">{benchmark.thresholds.good}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average:</span>
                        <span className="font-medium">{benchmark.thresholds.average}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Minimum:</span>
                        <span className="font-medium">{benchmark.thresholds.minimum}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {benchmark.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{benchmark.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}