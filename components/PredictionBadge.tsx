
import React from 'react';
import { Prediction } from '../types';

interface PredictionBadgeProps {
  label: string;
  prediction: Prediction;
}

export const PredictionBadge: React.FC<PredictionBadgeProps> = ({ label, prediction }) => {
  const percentage = (prediction.confidence * 100).toFixed(0);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-sm">
      <span className="font-medium text-slate-600 dark:text-slate-300">{label}:</span>
      <span className="font-semibold text-slate-800 dark:text-slate-100">{prediction.value}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">({percentage}%)</span>
    </div>
  );
};
