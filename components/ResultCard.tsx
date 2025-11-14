import React from 'react';
import { MatchedTarget, FeedbackType } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';

interface ResultCardProps {
  target: MatchedTarget;
  onFeedback: (targetId: string, feedbackType: FeedbackType) => void;
  isFeedbackSent: boolean;
}

const ThumbsUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.59-11.594c.081.203.117.417.117.634v.091c0 .546-.223 1.046-.594 1.42l-.494.504a2.25 2.25 0 0 1-1.423.594h-1.571a4.5 4.5 0 0 0-1.423.23l-3.114 1.04a4.5 4.5 0 0 0-1.423.23H5.904a2.25 2.25 0 0 1-2.25-2.25c0-.546.223-1.046.594-1.42l.494-.504a2.25 2.25 0 0 1 1.423-.594h1.571a4.5 4.5 0 0 0 1.423-.23l3.114-1.04a4.5 4.5 0 0 0 1.423-.23h.091c.217 0 .431.036.634.117z" />
    </svg>
);

const ThumbsDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904M14.25 12h.008v.008h-.008V12zM15.75 12h.008v.008h-.008V12zm-3 3h.008v.008h-.008V15zm-1.5 0h.008v.008h-.008V15z" transform="rotate(180 12 12)" />
    </svg>
);


const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);


export const ResultCard: React.FC<ResultCardProps> = ({ target, onFeedback, isFeedbackSent }) => {
  const isFromCustomDoc = target.source.includes('来自您上传的文档');
  
  return (
    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600">
      <div className="flex justify-between items-start mb-3">
        <div>
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{target.title}</h3>
            {isFromCustomDoc ? (
                 <p className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 mt-1 font-semibold bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full">
                    <DocumentTextIcon className="w-4 h-4" />
                    {target.source}
                </p>
            ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{target.source}</p>
            )}
        </div>
        <ConfidenceBadge confidence={target.confidence} />
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">关键证据:</p>
        <p className="text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
          "{target.evidence}"
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">即时观察项:</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {target.suggested_observations.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      
      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        {isFeedbackSent ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircleIcon className="w-5 h-5"/>
            <span>感谢您的反馈</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mr-2">这个匹配是否准确?</p>
            <button
              onClick={() => onFeedback(target.id, FeedbackType.CONFIRM)}
              title="准确"
              className="p-2 rounded-full text-slate-500 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/50 dark:hover:text-green-400 transition-colors"
            >
              <ThumbsUpIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onFeedback(target.id, FeedbackType.REJECT)}
              title="不准确"
              className="p-2 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors"
            >
              <ThumbsDownIcon className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
