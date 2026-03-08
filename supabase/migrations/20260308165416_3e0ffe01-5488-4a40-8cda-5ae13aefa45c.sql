
-- Chart of Accounts
CREATE TABLE public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'income', 'expense', 'equity')),
  parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Income Transactions
CREATE TABLE public.income_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_id UUID REFERENCES public.chart_of_accounts(id) NOT NULL,
  customer_name TEXT,
  description TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'mobile', 'check')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  reference_number TEXT,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  bank_account_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expense Transactions
CREATE TABLE public.expense_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_id UUID REFERENCES public.chart_of_accounts(id) NOT NULL,
  expense_category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'mobile', 'check')),
  vendor_supplier TEXT,
  reference_number TEXT,
  bank_account_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bank Accounts
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  branch TEXT,
  account_type TEXT NOT NULL DEFAULT 'current' CHECK (account_type IN ('current', 'savings', 'mobile_banking')),
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- General Ledger (auto-populated from all modules)
CREATE TABLE public.general_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_id UUID REFERENCES public.chart_of_accounts(id) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'adjustment', 'transfer', 'opening_balance')),
  description TEXT NOT NULL,
  debit NUMERIC NOT NULL DEFAULT 0,
  credit NUMERIC NOT NULL DEFAULT 0,
  running_balance NUMERIC NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK for bank_account_id
ALTER TABLE public.income_transactions ADD CONSTRAINT income_bank_fk FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.expense_transactions ADD CONSTRAINT expense_bank_fk FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_ledger ENABLE ROW LEVEL SECURITY;

-- Policies: Admin + Staff can read, Admin can write
CREATE POLICY "Admin full access chart_of_accounts" ON public.chart_of_accounts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Staff can view chart_of_accounts" ON public.chart_of_accounts FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admin full access income_transactions" ON public.income_transactions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Staff can view income_transactions" ON public.income_transactions FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert income_transactions" ON public.income_transactions FOR INSERT WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Admin full access expense_transactions" ON public.expense_transactions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Staff can view expense_transactions" ON public.expense_transactions FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert expense_transactions" ON public.expense_transactions FOR INSERT WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Admin full access bank_accounts" ON public.bank_accounts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Staff can view bank_accounts" ON public.bank_accounts FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admin full access general_ledger" ON public.general_ledger FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Staff can view general_ledger" ON public.general_ledger FOR SELECT USING (is_staff(auth.uid()));

-- Seed default chart of accounts
INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, description) VALUES
('1000', 'Cash', 'asset', 'Cash on hand'),
('1010', 'Bank Accounts', 'asset', 'Money in bank accounts'),
('1020', 'Accounts Receivable', 'asset', 'Money owed by customers'),
('1030', 'Mobile Banking', 'asset', 'Mobile banking balances'),
('2000', 'Accounts Payable', 'liability', 'Money owed to suppliers'),
('2010', 'Advance from Customers', 'liability', 'Customer advance payments'),
('3000', 'Owner Equity', 'equity', 'Owner investment'),
('3010', 'Retained Earnings', 'equity', 'Accumulated profits'),
('4000', 'Package Sales', 'income', 'Revenue from package bookings'),
('4010', 'Visa Service Income', 'income', 'Revenue from visa services'),
('4020', 'Air Ticket Income', 'income', 'Revenue from air tickets'),
('4030', 'Hotel Booking Income', 'income', 'Revenue from hotel bookings'),
('4040', 'Other Income', 'income', 'Miscellaneous income'),
('5000', 'Office Rent', 'expense', 'Monthly office rent'),
('5010', 'Utilities', 'expense', 'Electricity, water, internet'),
('5020', 'Salaries', 'expense', 'Employee salaries'),
('5030', 'Marketing', 'expense', 'Advertising and marketing costs'),
('5040', 'Travel & Transport', 'expense', 'Travel related expenses'),
('5050', 'Office Supplies', 'expense', 'Office materials and supplies'),
('5060', 'Miscellaneous', 'expense', 'Other expenses');
