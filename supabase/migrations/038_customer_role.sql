-- Customer role: who the company is to Enercon (nullable until sales categorizes).
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS customer_role TEXT
  CHECK (
    customer_role IS NULL OR customer_role IN (
      'End User/Owner',
      'EPC/Main Contractor',
      'Partner',
      'Principal',
      'Direct Quotation Customer'
    )
  );

CREATE INDEX IF NOT EXISTS idx_customers_customer_role
  ON public.customers (customer_role);
