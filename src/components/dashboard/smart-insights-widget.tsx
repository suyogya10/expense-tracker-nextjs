'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartInsight } from '@/lib/insights';
import { Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface SmartInsightsWidgetProps {
  insights: SmartInsight[];
}

export function SmartInsightsWidget({ insights }: SmartInsightsWidgetProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <Card className="border-border shadow-2xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Cycle Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {insights.map((item) => {
          let Icon = Info;
          let borderClass = 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-zinc-200';

          if (item.type === 'positive') {
            Icon = CheckCircle2;
            borderClass = 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200';
          } else if (item.type === 'warning') {
            Icon = AlertTriangle;
            borderClass = 'border-amber-200 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200';
          }

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-colors ${borderClass}`}
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold mr-1.5">{item.title}:</span>
                <span className="font-normal leading-relaxed">{item.message}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
