
export enum AgeGroup {
  THREE_TO_FOUR = '3-4岁',
  FOUR_TO_FIVE = '4-5岁',
  FIVE_TO_SIX = '5-6岁',
}

export interface QueryPayload {
  observation_text: string;
  age_group: AgeGroup;
}

export interface Prediction {
  value: string;
  confidence: number;
}

export interface MatchedTarget {
  id: string;
  title: string;
  source: string;
  evidence: string;
  confidence: number;
  suggested_observations: string[];
}

export interface QueryResult {
  queryId: string;
  inputText: string;
  domainPrediction: Prediction;
  agePrediction: Prediction;
  matchedTargets: MatchedTarget[];
}

export enum FeedbackType {
  CONFIRM = 'CONFIRM',
  REJECT = 'REJECT',
}

export interface FeedbackPayload {
  queryId: string;
  targetId: string;
  feedbackType: FeedbackType;
}

export interface CalibrationLog {
  id: string;
  timestamp: string;
  originalText: string;
  aiInitialEvidence: string[];
  calibratedEvidence: string[];
}
