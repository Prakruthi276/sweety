const SLOT_LABELS = {
  MORNING_FASTING: 'Morning (fasting)',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner',
};

module.exports = {
  SLOT_LABELS,
  SLOTS: Object.keys(SLOT_LABELS),
  MAX_PER_DAY: 4,
  MIN_VALUE: 40,
  MAX_VALUE: 600,
};
