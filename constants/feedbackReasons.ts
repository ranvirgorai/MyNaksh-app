/**
 * Feedback Reasons Configuration with i18n support
 * This centralized config allows for easy translation and maintenance
 */

export interface FeedbackReasonConfig {
  key: 'inaccurate' | 'vague' | 'long';
  label: string;
  i18nKey: string;
}

export const FEEDBACK_REASONS: Record<string, FeedbackReasonConfig> = {
  INACCURATE: {
    key: 'inaccurate',
    label: 'Inaccurate',
    i18nKey: 'feedback.reasons.inaccurate',
  },
  TOO_VAGUE: {
    key: 'vague',
    label: 'Too Vague',
    i18nKey: 'feedback.reasons.tooVague',
  },
  TOO_LONG: {
    key: 'long',
    label: 'Too Long',
    i18nKey: 'feedback.reasons.tooLong',
  },
};

// Helper function to get all feedback reasons as an array
export const getFeedbackReasonsArray = (): FeedbackReasonConfig[] => {
  return Object.values(FEEDBACK_REASONS);
};

// Helper function to get label by reason key
export const getLabelByReasonKey = (key: 'inaccurate' | 'vague' | 'long'): string => {
  const reason = Object.values(FEEDBACK_REASONS).find((r) => r.key === key);
  return reason?.label || '';
};
