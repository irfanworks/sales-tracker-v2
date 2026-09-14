-- Lost analysis: structured reason category on stage history (Lose / On Hold).
ALTER TABLE public.pipeline_stage_history
  ADD COLUMN IF NOT EXISTS reason_category TEXT
  CHECK (
    reason_category IS NULL OR reason_category IN (
      'Competitor',
      'Price Gap',
      'Technical/Commercial Reason',
      'Others'
    )
  );

CREATE INDEX IF NOT EXISTS idx_pipeline_stage_history_lost
  ON public.pipeline_stage_history (stage, reason_category, changed_at DESC)
  WHERE stage IN ('Lose', 'On Hold');
