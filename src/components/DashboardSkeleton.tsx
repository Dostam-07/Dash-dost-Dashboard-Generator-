import React from 'react';
import { motion } from 'motion/react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div id="dashboard-skeleton-view" className="space-y-6 w-full animate-pulse select-none">
      {/* Header Bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-zinc-900/60 pb-6">
        <div className="space-y-2 max-w-xl">
          <div className="h-8 w-2/3 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-4 w-1/2 bg-slate-200/70 dark:bg-zinc-800/60 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-9 w-32 bg-slate-200/80 dark:bg-zinc-800/80 rounded-xl" />
        </div>
      </div>

      {/* Breadcrumbs Skeleton */}
      <div className="h-8 w-48 bg-slate-100 dark:bg-zinc-900/40 rounded-lg" />

      {/* Filters Area Skeleton */}
      <div className="bg-slate-50/50 dark:bg-zinc-950/20 rounded-2xl border border-slate-200/60 dark:border-zinc-900 p-4 shrink-0 flex flex-wrap gap-3 items-center">
        <div className="h-5 w-16 bg-slate-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-8 w-28 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-8 w-36 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-8 w-32 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
        <div className="ml-auto h-8 w-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* Pages Tab Skeleton if needed */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-900 pb-1">
        <div className="h-4 w-16 bg-slate-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-7 w-20 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-7 w-24 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
      </div>

      {/* Main Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch w-full">
        {/* KPI Card Skeleton 1 */}
        <div className="col-span-12 md:col-span-4 bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-900 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-slate-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-6 w-6 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-20 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-4.5 w-32 bg-slate-200/70 dark:bg-zinc-805 rounded-lg" />
          </div>
        </div>

        {/* KPI Card Skeleton 2 */}
        <div className="col-span-12 md:col-span-4 bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-900 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-6 w-6 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-4.5 w-24 bg-slate-200/70 dark:bg-zinc-805 rounded-lg" />
          </div>
        </div>

        {/* KPI Card Skeleton 3 */}
        <div className="col-span-12 md:col-span-4 bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-900 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-slate-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-6 w-6 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-16 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-4.5 w-36 bg-slate-200/70 dark:bg-zinc-805 rounded-lg" />
          </div>
        </div>

        {/* Chart Card Skeleton 1 */}
        <div className="col-span-12 md:col-span-7 bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-900 rounded-2xl p-5 shadow-xs space-y-5 h-[340px] flex flex-col justify-between">
          <div className="space-y-1.5 pb-2">
            <div className="h-5 w-48 bg-slate-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-3 w-72 bg-slate-200/75 dark:bg-zinc-805 rounded-md" />
          </div>
          <div className="flex-1 flex items-end gap-3 px-2">
            <div className="w-full bg-slate-100/60 dark:bg-zinc-900/40 rounded-t-xl h-[40%]" />
            <div className="w-full bg-slate-200/70 dark:bg-zinc-800/50 rounded-t-xl h-[75%]" />
            <div className="w-full bg-slate-100/60 dark:bg-zinc-900/40 rounded-t-xl h-[55%]" />
            <div className="w-full bg-slate-200/70 dark:bg-zinc-800/50 rounded-t-xl h-[90%]" />
            <div className="w-full bg-slate-100/60 dark:bg-zinc-900/40 rounded-t-xl h-[30%]" />
            <div className="w-full bg-slate-200/70 dark:bg-zinc-800/50 rounded-t-xl h-[60%]" />
            <div className="w-full bg-slate-100/60 dark:bg-zinc-900/40 rounded-t-xl h-[80%]" />
          </div>
        </div>

        {/* Chart Card Skeleton 2 (Pie/Activity) */}
        <div className="col-span-12 md:col-span-5 bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-900 rounded-2xl p-5 shadow-xs h-[340px] flex flex-col justify-between items-center text-center">
          <div className="self-start space-y-1.5 w-full">
            <div className="h-5 w-32 bg-slate-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-3 w-48 bg-slate-200/75 dark:bg-zinc-805 rounded-md" />
          </div>
          <div className="my-auto h-32 w-32 rounded-full border-[18px] border-slate-200 dark:border-zinc-800 flex items-center justify-center animate-pulse" />
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-zinc-800" /><div className="h-3 w-12 bg-slate-200 dark:bg-zinc-800 rounded-md" /></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-zinc-800" /><div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded-md" /></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-zinc-800" /><div className="h-3 w-10 bg-slate-200 dark:bg-zinc-800 rounded-md" /></div>
          </div>
        </div>
      </div>
    </div>
  );
};
