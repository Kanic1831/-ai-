
import React from 'react';
import { QueryResult, FeedbackType } from '../types';
import { ResultCard } from './ResultCard';
import { Spinner } from './Spinner';
import { PredictionBadge } from './PredictionBadge';

interface ResultsDisplayProps {
  results: QueryResult | null;
  isLoading: boolean;
  error: string | null;
  onFeedback: (targetId: string, feedbackType: FeedbackType) => void;
  feedbackSent: Set<string>;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading, error, onFeedback, feedbackSent }) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Spinner />
        <p className="mt-4 text-slate-500 dark:text-slate-400">AI 正在分析您的观察记录，请稍候...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-500 font-medium">{error}</div>;
  }

  if (!results) {
    return null;
  }

  return (
    <div className="mt-8">
       <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg mb-6">
         <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">原始记录:</p>
         <blockquote className="italic text-slate-700 dark:text-slate-300 border-l-4 border-blue-500 pl-4">
           "{results.inputText}"
         </blockquote>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <PredictionBadge label="主要领域" prediction={results.domainPrediction} />
        <PredictionBadge label="年龄段" prediction={results.agePrediction} />
      </div>

      <div className="space-y-4">
        {results.matchedTargets.map((target) => (
          <ResultCard
            key={target.id}
            target={target}
            onFeedback={onFeedback}
            isFeedbackSent={feedbackSent.has(target.id)}
          />
        ))}
      </div>
    </div>
  );
};
