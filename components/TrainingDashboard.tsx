
import React, { useState, useEffect } from 'react';
import { CalibrationLog } from '../types';
import { getGrowthInsightAnalysis } from '../services/guideService';
import { Spinner } from './Spinner';
import { DataManagement } from './DataManagement';


const renderHighlightedText = (text: string, phrases: string[]) => {
  if (!phrases || phrases.length === 0) {
    return text;
  }
  const uniquePhrases = [...new Set(phrases)].sort((a, b) => b.length - a.length);
  let content = text;
  
  uniquePhrases.forEach(phrase => {
    const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
    if (escapedPhrase === '') return;
    try {
        const regex = new RegExp(`(${escapedPhrase})`, 'g');
        content = content.replace(regex, `<span class="bg-yellow-200 dark:bg-yellow-800/60 rounded px-1">${'$1'}</span>`);
    } catch (e) {
        console.warn(`Could not apply regex for phrase: "${escapedPhrase}"`, e);
    }
  });

  return <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />;
};

const GrowthInsight: React.FC<{ log: CalibrationLog }> = ({ log }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [insight, setInsight] = useState('');

    useEffect(() => {
        const fetchInsight = async () => {
            setIsLoading(true);
            try {
                const analysis = await getGrowthInsightAnalysis({
                    originalText: log.originalText,
                    aiInitialEvidence: log.aiInitialEvidence,
                    calibratedEvidence: log.calibratedEvidence,
                });
                setInsight(analysis);
            } catch (error) {
                console.error(error);
                setInsight('无法加载AI成长洞探分析。');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsight();
    }, [log]);

    return (
        <div className="p-3 bg-blue-50 dark:bg-slate-800/60 border border-blue-200 dark:border-slate-700 rounded-lg min-h-[80px]">
            <h5 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-2">AI成长洞探</h5>
            {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Spinner />
                    <span>AI 正在分析学习成果...</span>
                </div>
            ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{insight}</p>
            )}
        </div>
    );
};

interface TrainingDashboardProps {
  logs: CalibrationLog[];
  onClearLogs: () => void;
}

export const TrainingDashboard: React.FC<TrainingDashboardProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 transition-colors duration-300 animate-fade-in">
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">AI 成长看板</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          这里记录了您的每一次校准，它们是AI成长的基石。
        </p>
      </div>
      
      <DataManagement logs={logs} onClear={onClearLogs} />

      <div>
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">训练日志 (“错题本”)</h3>
        {logs.length === 0 ? (
          <div className="text-center py-10 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
            <p className="text-slate-500 dark:text-slate-400">暂无训练记录。</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">完成一次“提取关键证据”并进行分析后，这里将显示您的第一条训练日志。</p>
          </div>
        ) : (
          <div className="space-y-6">
            {logs.map(log => (
              <div key={log.id} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                   <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(log.timestamp).toLocaleString('zh-CN')}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 italic line-clamp-2">
                    原始记录: “{log.originalText}”
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-4 bg-white dark:bg-slate-800 md:border-r md:border-slate-200 md:dark:border-slate-700">
                    <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">AI判定</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                      {log.aiInitialEvidence.length > 0 ? renderHighlightedText(log.originalText, log.aiInitialEvidence) : <span className="text-slate-400 italic">AI未提取到证据</span>}
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 md:border-t-0">
                    <h4 className="text-sm font-semibold mb-2 text-green-600 dark:text-green-400">人工校准</h4>
                     <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                      {log.calibratedEvidence.length > 0 ? renderHighlightedText(log.originalText, log.calibratedEvidence) : <span className="text-slate-400 italic">您未校准任何证据</span>}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <GrowthInsight log={log} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
