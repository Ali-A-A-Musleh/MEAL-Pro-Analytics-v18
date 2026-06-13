import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="w-full space-y-6 py-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between animate-pulse px-2">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded-md"></div>
          <div className="h-3 w-32 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-9 w-24 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Grid of chart skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div 
            key={i} 
            className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-5 animate-pulse"
          >
            {/* Card Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-3/4 bg-slate-200 rounded-md"></div>
                <div className="h-2.5 w-1/2 bg-slate-200 rounded-md"></div>
              </div>
              <div className="h-8 w-8 bg-slate-200 rounded-xl"></div>
            </div>

            {/* Card Body - Simulated Chart */}
            <div className="h-48 bg-slate-50 rounded-2xl flex items-end justify-between p-4 space-x-2">
              {[60, 80, 45, 90, 30, 75, 50].map((height, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-200 rounded-t-md w-full"
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>

            {/* Card Footer */}
            <div className="flex justify-between items-center pt-2">
              <div className="h-3.5 w-16 bg-slate-200 rounded-md"></div>
              <div className="h-7 w-20 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
