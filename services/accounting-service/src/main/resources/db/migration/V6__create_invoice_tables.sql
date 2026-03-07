-- Invoice Module Tables
-- Implements sales invoicing with VAT support for South African businesses

-- Customers (for invoicing)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Customer details
    customer_code VARCHAR(20) NOT NULL UNIQUE,
    customer_name VARCHAR(200) NOT NULL,
    trading_name VARCHAR(200),

    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    fax VARCHAR(50),
    website VARCHAR(255),

    -- Contact person
    contact_person VARCHAR(200),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'South Africa',

    -- Billing address (if different)
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_province VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),

    -- Tax details
    vat_number VARCHAR(20),
    tax_exempt BOOLEAN DEFAULT FALSE,

    -- Financial settings
    payment_terms INT DEFAULT 30,                  -- Days until due
    credit_limit DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'ZAR',

    -- Default accounts
    default_revenue_account_id UUID REFERENCES accounts(id),
    default_receivable_account_id UUID REFERENCES accounts(id),

    -- Status
    active BOOLEAN DEFAULT TRUE,

    -- Notes
    notes VARCHAR(2000),

    -- Multi-tenant
    tenant_id UUID,

    -- BaseEntity fields
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id) WHERE deleted = FALSE;

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Invoice identification
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_type VARCHAR(20) NOT NULL DEFAULT 'INVOICE',  -- INVOICE, CREDIT_NOTE, DEBIT_NOTE, PROFORMA

    -- Customer reference
    customer_id UUID NOT NULL REFERENCES customers(id),

    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    -- Reference
    reference VARCHAR(100),
    purchase_order VARCHAR(100),

    -- Amounts (all in invoice currency)
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    subtotal_after_discount DECIMAL(15,2) NOT NULL DEFAULT 0,
    vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Payment tracking
    amount_paid DECIMAL(15,2) DEFAULT 0,
    amount_due DECIMAL(15,2) DEFAULT 0,

    -- Currency
    currency VARCHAR(3) DEFAULT 'ZAR',
    exchange_rate DECIMAL(10,6) DEFAULT 1.0,

    -- Accounting integration
    journal_entry_id UUID REFERENCES journal_entries(id),
    posted_at TIMESTAMPTZ,
    posted_by UUID,

    -- Customer snapshot (at time of invoice)
    customer_name VARCHAR(200),
    customer_email VARCHAR(255),
    customer_address TEXT,
    customer_vat_number VARCHAR(20),

    -- Sending details
    sent_at TIMESTAMPTZ,
    sent_by UUID,
    sent_to_email VARCHAR(255),
    last_reminder_at TIMESTAMPTZ,
    reminder_count INT DEFAULT 0,

    -- Notes
    notes VARCHAR(2000),
    terms_and_conditions TEXT,
    footer_text VARCHAR(500),

    -- Internal notes (not shown on invoice)
    internal_notes VARCHAR(2000),

    -- Multi-tenant
    tenant_id UUID,

    -- BaseEntity fields
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_invoice_type CHECK (invoice_type IN ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'PROFORMA')),
    CONSTRAINT chk_invoice_status CHECK (status IN ('DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID', 'WRITTEN_OFF'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id) WHERE deleted = FALSE;

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Line details
    line_number INT NOT NULL,
    description VARCHAR(500) NOT NULL,

    -- Product/Service reference (optional)
    product_id UUID,
    product_code VARCHAR(50),
    product_name VARCHAR(200),

    -- Quantity and pricing
    quantity DECIMAL(15,4) NOT NULL DEFAULT 1,
    unit_of_measure VARCHAR(20),
    unit_price DECIMAL(15,4) NOT NULL,

    -- Discount
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,

    -- VAT
    vat_category VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    vat_rate DECIMAL(5,4) DEFAULT 0.15,
    vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Totals
    line_subtotal DECIMAL(15,2) NOT NULL,      -- qty * unit_price - discount
    line_total DECIMAL(15,2) NOT NULL,          -- subtotal + VAT

    -- Account mapping
    revenue_account_id UUID REFERENCES accounts(id),

    -- BaseEntity fields
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_invoice_line_vat CHECK (vat_category IN ('STANDARD', 'ZERO_RATED', 'EXEMPT', 'OUT_OF_SCOPE'))
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id) WHERE deleted = FALSE;

-- Invoice Payments
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Payment details
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),                -- CASH, EFT, CARD, CHECK, OTHER
    reference VARCHAR(100),

    -- Bank details (if applicable)
    bank_account_id UUID REFERENCES bank_accounts(id),
    bank_transaction_id UUID REFERENCES bank_transactions(id),

    -- Accounting integration
    journal_entry_id UUID REFERENCES journal_entries(id),

    -- Notes
    notes VARCHAR(500),

    -- BaseEntity fields
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_payment_method CHECK (payment_method IN ('CASH', 'EFT', 'CARD', 'CHECK', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoice_payments_date ON invoice_payments(payment_date) WHERE deleted = FALSE;

-- Invoice number sequence
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1001;

-- Triggers for updated_at (drop if exists for idempotency)
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_lines_updated_at ON invoice_lines;
CREATE TRIGGER update_invoice_lines_updated_at
    BEFORE UPDATE ON invoice_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_payments_updated_at ON invoice_payments;
CREATE TRIGGER update_invoice_payments_updated_at
    BEFORE UPDATE ON invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed default payment terms for common scenarios
COMMENT ON TABLE customers IS 'Customer master data for invoicing';
COMMENT ON TABLE invoices IS 'Sales invoices with VAT support';
COMMENT ON TABLE invoice_lines IS 'Invoice line items with VAT calculation';
COMMENT ON TABLE invoice_payments IS 'Payments received against invoices';
