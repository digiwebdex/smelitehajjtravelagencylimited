-- ============================================================
-- Database Functions & Triggers
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
    GROUP BY table_name
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    ', tbl);
  END LOOP;
END;
$$;

-- Is Admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = current_setting('app.current_user_id', true)::uuid AND role = 'admin'
  )
$$;

-- Is Admin or Viewer
CREATE OR REPLACE FUNCTION public.is_admin_or_viewer()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = current_setting('app.current_user_id', true)::uuid AND (role = 'admin' OR role = 'viewer')
  )
$$;

-- Has Staff Role
CREATE OR REPLACE FUNCTION public.has_staff_role(_user_id UUID, _role staff_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE user_id = _user_id AND role = _role AND is_active = true
  )
$$;

-- Is Staff
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE user_id = _user_id AND is_active = true
  )
$$;

-- Get Staff Role
CREATE OR REPLACE FUNCTION public.get_staff_role(_user_id UUID)
RETURNS staff_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT role FROM public.staff_members
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1
$$;

-- Get Public Payment Methods
CREATE OR REPLACE FUNCTION public.get_public_payment_methods()
RETURNS TABLE(id UUID, name TEXT, slug TEXT, description TEXT, icon_name TEXT, is_enabled BOOLEAN, order_index INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT id, name, slug, description, icon_name, is_enabled, order_index
  FROM public.payment_methods
  WHERE is_enabled = true
  ORDER BY order_index;
$$;

-- Create Customer from Booking (trigger function)
CREATE OR REPLACE FUNCTION public.create_customer_from_booking()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE booking_id = NEW.id) THEN
    INSERT INTO public.customers (booking_id, user_id, full_name, email, phone)
    VALUES (
      NEW.id,
      NEW.user_id,
      COALESCE(NEW.guest_name, 'Customer'),
      NEW.guest_email,
      NEW.guest_phone
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_customer_after_booking
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.create_customer_from_booking();

-- Set Booking Total Price (trigger function)
CREATE OR REPLACE FUNCTION public.set_booking_total_price()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  package_price DECIMAL(10,2);
BEGIN
  SELECT price INTO package_price FROM public.packages WHERE id = NEW.package_id;
  NEW.total_price = package_price * NEW.passenger_count;
  RETURN NEW;
END;
$$;

-- Get Payment Asset Account
CREATE OR REPLACE FUNCTION public.get_payment_asset_account(p_payment_method TEXT)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE p_payment_method
    WHEN 'cash' THEN (SELECT id FROM chart_of_accounts WHERE account_code = '1000' LIMIT 1)
    WHEN 'bank' THEN (SELECT id FROM chart_of_accounts WHERE account_code = '1010' LIMIT 1)
    WHEN 'check' THEN (SELECT id FROM chart_of_accounts WHERE account_code = '1010' LIMIT 1)
    WHEN 'mobile' THEN (SELECT id FROM chart_of_accounts WHERE account_code = '1030' LIMIT 1)
    ELSE (SELECT id FROM chart_of_accounts WHERE account_code = '1000' LIMIT 1)
  END;
$$;

-- Update Account Balance on Ledger Change
CREATE OR REPLACE FUNCTION public.update_account_balance_on_ledger_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  affected_account_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_account_id := OLD.account_id;
  ELSE
    affected_account_id := NEW.account_id;
  END IF;

  UPDATE chart_of_accounts
  SET current_balance = opening_balance + COALESCE(
    (SELECT SUM(debit) - SUM(credit) FROM general_ledger WHERE account_id = affected_account_id), 0
  ), updated_at = NOW()
  WHERE id = affected_account_id;

  IF TG_OP = 'UPDATE' AND OLD.account_id != NEW.account_id THEN
    UPDATE chart_of_accounts
    SET current_balance = opening_balance + COALESCE(
      (SELECT SUM(debit) - SUM(credit) FROM general_ledger WHERE account_id = OLD.account_id), 0
    ), updated_at = NOW()
    WHERE id = OLD.account_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_balance_on_ledger
AFTER INSERT OR UPDATE OR DELETE ON public.general_ledger
FOR EACH ROW EXECUTE FUNCTION public.update_account_balance_on_ledger_change();

-- Recalculate Account Balances
CREATE OR REPLACE FUNCTION public.recalculate_account_balances()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE chart_of_accounts coa
  SET current_balance = coa.opening_balance + COALESCE(
    (SELECT SUM(gl.debit) - SUM(gl.credit) FROM general_ledger gl WHERE gl.account_id = coa.id), 0
  ), updated_at = NOW();
END;
$$;

-- Get Financial Summary
CREATE OR REPLACE FUNCTION public.get_financial_summary()
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  result JSON;
  v_total_sales NUMERIC;
  v_income_received NUMERIC;
  v_total_expense NUMERIC;
  v_customer_due NUMERIC;
  v_total_commission NUMERIC;
  v_cash_balance NUMERIC;
  v_bank_balance NUMERIC;
  v_mobile_balance NUMERIC;
  v_receivable NUMERIC;
  v_payable NUMERIC;
BEGIN
  SELECT COALESCE(SUM(total_price), 0) INTO v_total_sales FROM bookings WHERE status IN ('confirmed', 'completed');
  SELECT COALESCE(SUM(amount), 0) INTO v_income_received FROM income_transactions;
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expense FROM expense_transactions;
  SELECT COALESCE(SUM(pending_commission), 0) INTO v_total_commission FROM agents WHERE is_active = true;

  SELECT COALESCE(current_balance, 0) INTO v_cash_balance FROM chart_of_accounts WHERE account_code = '1000';
  SELECT COALESCE(current_balance, 0) INTO v_bank_balance FROM chart_of_accounts WHERE account_code = '1010';
  SELECT COALESCE(current_balance, 0) INTO v_mobile_balance FROM chart_of_accounts WHERE account_code = '1030';
  SELECT COALESCE(current_balance, 0) INTO v_receivable FROM chart_of_accounts WHERE account_code = '1020';
  SELECT COALESCE(current_balance, 0) INTO v_payable FROM chart_of_accounts WHERE account_code = '2000';

  v_customer_due := v_total_sales - v_income_received;

  result := json_build_object(
    'total_sales', v_total_sales,
    'income_received', v_income_received,
    'total_expense', v_total_expense,
    'net_profit', v_income_received - v_total_expense,
    'customer_due', v_customer_due,
    'commission', v_total_commission,
    'cash_balance', v_cash_balance,
    'bank_balance', v_bank_balance,
    'mobile_balance', v_mobile_balance,
    'receivable', v_receivable,
    'payable', v_payable,
    'total_liquid', v_cash_balance + v_bank_balance + v_mobile_balance
  );

  RETURN result;
END;
$$;

-- Handle New User (create profile on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created
AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
