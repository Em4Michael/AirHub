'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function BonusesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bonuses</h1>
        <p className="text-gray-600 mt-1">Manage user bonuses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bonus Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Bonus management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}