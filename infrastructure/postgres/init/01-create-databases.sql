-- SureWork ERP Platform - Database Initialization Script
-- Creates all required databases for microservices

-- Admin Service Database
CREATE DATABASE surework_admin;
GRANT ALL PRIVILEGES ON DATABASE surework_admin TO surework;

-- Employee Service Database
CREATE DATABASE surework_employee;
GRANT ALL PRIVILEGES ON DATABASE surework_employee TO surework;

-- Leave Service Database
CREATE DATABASE surework_leave;
GRANT ALL PRIVILEGES ON DATABASE surework_leave TO surework;

-- Payroll Service Database
CREATE DATABASE surework_payroll;
GRANT ALL PRIVILEGES ON DATABASE surework_payroll TO surework;

-- Accounting Service Database
CREATE DATABASE surework_accounting;
GRANT ALL PRIVILEGES ON DATABASE surework_accounting TO surework;

-- Recruitment Service Database
CREATE DATABASE surework_recruitment;
GRANT ALL PRIVILEGES ON DATABASE surework_recruitment TO surework;

-- Time & Attendance Service Database
CREATE DATABASE surework_time;
GRANT ALL PRIVILEGES ON DATABASE surework_time TO surework;

-- Document Service Database
CREATE DATABASE surework_document;
GRANT ALL PRIVILEGES ON DATABASE surework_document TO surework;

-- Reporting Service Database
CREATE DATABASE surework_reporting;
GRANT ALL PRIVILEGES ON DATABASE surework_reporting TO surework;

-- Analytics Service Database (Admin Dashboard)
CREATE DATABASE surework_analytics;
GRANT ALL PRIVILEGES ON DATABASE surework_analytics TO surework;

-- Billing Service Database (Admin Dashboard)
CREATE DATABASE surework_billing;
GRANT ALL PRIVILEGES ON DATABASE surework_billing TO surework;

-- Connect to each database and create extensions
\c surework_admin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c surework_employee
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c surework_leave
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c surework_payroll
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c surework_accounting
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c surework_recruitment
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c surework_time
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c surework_document
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c surework_reporting
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c surework_analytics
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c surework_billing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log completion
\echo 'SureWork databases initialized successfully'
