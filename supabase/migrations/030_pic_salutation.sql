-- PIC salutation (Mr. / Mrs. / Ms.) on pipelines and prospects snapshots.

ALTER TABLE public.pipelines
  ADD COLUMN IF NOT EXISTS pic_salutation TEXT;

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS pic_salutation TEXT;

ALTER TABLE public.pipelines
  DROP CONSTRAINT IF EXISTS pipelines_pic_salutation_check;

ALTER TABLE public.pipelines
  ADD CONSTRAINT pipelines_pic_salutation_check
  CHECK (pic_salutation IS NULL OR pic_salutation IN ('Mr.', 'Mrs.', 'Ms.'));

ALTER TABLE public.prospects
  DROP CONSTRAINT IF EXISTS prospects_pic_salutation_check;

ALTER TABLE public.prospects
  ADD CONSTRAINT prospects_pic_salutation_check
  CHECK (pic_salutation IS NULL OR pic_salutation IN ('Mr.', 'Mrs.', 'Ms.'));

COMMENT ON COLUMN public.pipelines.pic_salutation IS
  'Courtesy title for customer PIC: Mr. / Mrs. / Ms.';

COMMENT ON COLUMN public.prospects.pic_salutation IS
  'Courtesy title for customer PIC: Mr. / Mrs. / Ms.';
