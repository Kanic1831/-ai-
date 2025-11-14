
import { CalibrationLog, FeedbackPayload, QueryResult } from '../types';
import { ObservationFormData } from '../components/ObservationForm';
import * as gemini from './geminiService';

export const extractEvidence = async (
    observationText: string
): Promise<string[]> => {
    return gemini.extractEvidence(observationText);
};

export const queryGuide = async (
    data: ObservationFormData,
    calibrationLogs?: CalibrationLog[]
): Promise<QueryResult> => {
    return gemini.queryGuide(data, calibrationLogs);
};


export const sendFeedback = (feedback: FeedbackPayload): Promise<{ success: boolean }> => {
  console.log('Sending feedback:', feedback);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
};

export const logCalibrationData = (logData: Omit<CalibrationLog, 'id' | 'timestamp'>): Promise<{ success: true; log: CalibrationLog }> => {
  console.log("Logging calibration data:", logData);
  // This is a mock function. In a real app, this would send data to a backend server.
  return new Promise((resolve) => {
    setTimeout(() => {
      const newLog: CalibrationLog = {
        ...logData,
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      resolve({ success: true, log: newLog });
    }, 300);
  });
};

// Meta-analysis is a complex task tied to a specific model's reasoning.
// We'll keep this hardcoded to Gemini for consistency.
export const getGrowthInsightAnalysis = async (log: Pick<CalibrationLog, 'originalText' | 'aiInitialEvidence' | 'calibratedEvidence'>): Promise<string> => {
    return gemini.getGrowthInsightAnalysis(log);
};
