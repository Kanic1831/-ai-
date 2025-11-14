
import React, { useState, useCallback, useEffect } from 'react';
import { ObservationForm, ObservationFormData } from './components/ObservationForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { queryGuide, sendFeedback, logCalibrationData } from './services/guideService';
import { QueryResult, FeedbackType, CalibrationLog } from './types';
import { Header } from './components/Header';
import { Intro } from './components/Intro';
import { TrainingDashboard } from './components/TrainingDashboard';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());
  
  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  
  // Load calibration logs from localStorage on initial render
  const [calibrationLogs, setCalibrationLogs] = useState<CalibrationLog[]>(() => {
    try {
      const savedLogs = window.localStorage.getItem('calibrationLogs');
      return savedLogs ? JSON.parse(savedLogs) : [];
    } catch (error) {
      console.error("Failed to parse calibration logs from localStorage", error);
      return [];
    }
  });

  // Save calibration logs to localStorage whenever they change
  useEffect(() => {
    try {
      window.localStorage.setItem('calibrationLogs', JSON.stringify(calibrationLogs));
    } catch (error) {
      console.error("Failed to save calibration logs to localStorage", error);
    }
  }, [calibrationLogs]);


  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleDashboard = () => {
    setShowDashboard(prev => !prev);
  }

  const handleSubmit = useCallback(async (data: ObservationFormData) => {
    setError(null);
    if (!data.observationText.trim()) {
      setError("请输入观察内容。");
      return;
    }

    // Log calibration attempt if there was an initial attempt OR a final calibration.
    // This ensures logging even if AI found nothing but user added evidence.
    if (data.aiInitialEvidence.length > 0 || (data.keyEvidence && data.keyEvidence.length > 0)) {
      try {
        const { log } = await logCalibrationData({
          originalText: data.observationText,
          aiInitialEvidence: data.aiInitialEvidence,
          calibratedEvidence: data.keyEvidence || [],
        });
        setCalibrationLogs(prev => [log, ...prev]);
      } catch (logError) {
        console.error("Failed to log calibration data:", logError);
        // Non-critical, so we don't block the main query
      }
    }

    setIsLoading(true);
    setResults(null);
    setFeedbackSent(new Set());
    setShowDashboard(false); // Go back to main view on new query
    try {
      const response = await queryGuide(data, calibrationLogs);
      setResults(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '服务暂时不可用，请稍后再试。';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [calibrationLogs]);

  const handleFeedback = useCallback(async (targetId: string, feedbackType: FeedbackType) => {
    if (!results) return;

    try {
      await sendFeedback({
        queryId: results.queryId,
        targetId: targetId,
        feedbackType: feedbackType,
      });
      setFeedbackSent(prev => new Set(prev).add(targetId));
    } catch (err) {
      // Could show a toast notification here
      console.error("Failed to send feedback", err);
    }
  }, [results]);
  
  const handleNewQuery = () => {
    setResults(null);
    setError(null);
    setShowDashboard(false);
  }

  const handleClearLogs = () => {
    if (window.confirm('您确定要清空所有校准日志吗？此操作不可撤销。')) {
        try {
            window.localStorage.removeItem('calibrationLogs');
            setCalibrationLogs([]);
        } catch (error) {
            console.error("Failed to clear calibration logs from localStorage", error);
            setError("清除日志时出错。");
        }
    }
  };


  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onToggleDashboard={toggleDashboard}
        showDashboard={showDashboard}
      />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div style={{ display: showDashboard ? 'block' : 'none' }}>
          <TrainingDashboard logs={calibrationLogs} onClearLogs={handleClearLogs} />
        </div>
        <div style={{ display: showDashboard ? 'none' : 'block' }}>
            {!results && !isLoading && <Intro />}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 transition-colors duration-300">
              <ObservationForm 
                onSubmit={handleSubmit} 
                isLoading={isLoading} 
                isResultView={!!results} 
                onNewQuery={handleNewQuery} 
              />
              <ResultsDisplay
                results={results}
                isLoading={isLoading}
                error={error}
                onFeedback={handleFeedback}
                feedbackSent={feedbackSent}
              />
            </div>
        </div>
        <footer className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
          <p>&copy; 2024 Ai助教。保留所有权利。</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
