# Overtime Management Portal — Database Schema

> **Database:** PostgreSQL 14+  
> **Tables:** 10 | **ENUMs:** 3 | **Indexes:** 9

---

## Table of Contents

- [ENUMs](#enums)
- [Reference Tables](#reference-tables)
  - [entities](#entities)
  - [departments](#departments)
  - [grades](#grades)
  - [public\_holidays](#public_holidays)
- [People](#people)
  - [users](#users)
  - [shift\_templates](#shift_templates)
- [Operations](#operations)
  - [attendance](#attendance)
  - [ot\_records](#ot_records)
  - [ot\_pay\_calculations](#ot_pay_calculations)
  - [payroll\_exports](#payroll_exports)
- [Indexes](#indexes)
- [Pay Formulas](#pay-formulas)
- [Seed Data](#seed-data)
- [Full DDL](#full-ddl)

---

## ENUMs

```sql
CREATE TYPE user_role        AS ENUM ('Employee', 'Manager', 'Hr');
CREATE TYPE attendance_status AS ENUM ('Present', 'Weekend', 'Leave', 'Holiday');
CREATE TYPE approval_status   AS ENUM ('Pending', 'Approved', 'Rejected');
```

| ENUM | Values |
|---|---|
| `user_role` | `Employee` · `Manager` · `Hr` |
| `attendance_status` | `Present` · `Weekend` · `Leave` · `Holiday` |
| `approval_status` | `Pending` · `Approved` · `Rejected` |

---

## Reference Tables

### entities

Stores company / legal entity names.

```sql
CREATE TABLE entities (
    id    SERIAL       PRIMARY KEY,
    name  VARCHAR(100) NOT NULL UNIQUE
);
```

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `SERIAL` | PK | Auto-increment |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | e.g. `Etihad Rail` |

---

### departments

Departments scoped per entity.

```sql
CREATE TABLE departments (
    id         SERIAL       PRIMARY KEY,
    entity_id  INT          NOT NULL REFERENCES entities(id),
    name       VARCHAR(100) NOT NULL,
    UNIQUE (entity_id, name)
);
```

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `entity_id` | `INT` | FK → entities, NOT NULL | |
| `name` | `VARCHAR(100)` | NOT NULL | e.g. `IT & Systems` |

**Unique constraint:** `(entity_id, name)`

---

### grades

Maps a pay grade code to the monthly gross salary in AED.  
`G12` = 1,000 AED → `G1` = 12,000 AED.

```sql
CREATE TABLE grades (
    code       VARCHAR(5)    PRIMARY KEY,
    gross_pay  NUMERIC(10,2) NOT NULL
);
```

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `code` | `VARCHAR(5)` | PK | e.g. `G1`, `G5`, `G12` |
| `gross_pay` | `NUMERIC(10,2)` | NOT NULL | Monthly gross in AED |

---

### public_holidays

Official public holiday calendar. Week-off days (Sat/Sun) are derived from shift templates, not this table.

```sql
CREATE TABLE public_holidays (
    id            SERIAL       PRIMARY KEY,
    holiday_date  DATE         NOT NULL UNIQUE,
    name          VARCHAR(200)
);
```

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `holiday_date` | `DATE` | NOT NULL, UNIQUE | |
| `name` | `VARCHAR(200)` | | e.g. `Eid Al Adha` |

---

## People

### users

All employees, managers and HR in a single table discriminated by `role`.  
Managers and HR have `manager_id = NULL`; employees point to their line manager.

```sql
CREATE TABLE users (
    id              VARCHAR(20)  PRIMARY KEY,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(200) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    role            user_role    NOT NULL,
    job_title       VARCHAR(200),
    entity_id       INT          NOT NULL REFERENCES entities(id),
    department_id   INT          NOT NULL REFERENCES departments(id),
    grade_code      VARCHAR(5)   REFERENCES grades(code),
    manager_id      VARCHAR(20)  REFERENCES users(id),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(20)` | PK | e.g. `EMP-1001` |
| `username` | `VARCHAR(100)` | NOT NULL, UNIQUE | |
| `password_hash` | `VARCHAR(255)` | NOT NULL | bcrypt / argon2 hash |
| `display_name` | `VARCHAR(200)` | NOT NULL | |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | |
| `role` | `user_role` | NOT NULL | `Employee` \| `Manager` \| `Hr` |
| `job_title` | `VARCHAR(200)` | | |
| `entity_id` | `INT` | FK → entities, NOT NULL | |
| `department_id` | `INT` | FK → departments, NOT NULL | |
| `grade_code` | `VARCHAR(5)` | FK → grades | NULL for Manager / Hr roles |
| `manager_id` | `VARCHAR(20)` | FK → users (self) | NULL for managers and HR |
| `is_active` | `BOOLEAN` | NOT NULL | DEFAULT `TRUE` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT `NOW()` |

---

### shift_templates

Per-employee shift windows with a validity date range, allowing shift changes over time.  
`valid_to = NULL` means the template is currently active.

```sql
CREATE TABLE shift_templates (
    id                  SERIAL       PRIMARY KEY,
    employee_id         VARCHAR(20)  NOT NULL REFERENCES users(id),
    valid_from          DATE         NOT NULL,
    valid_to            DATE,
    shift_start         TIME         NOT NULL,
    shift_end           TIME         NOT NULL,
    shift_duration_hrs  NUMERIC(4,2) NOT NULL DEFAULT 8,
    UNIQUE (employee_id, valid_from)
);
```

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `employee_id` | `VARCHAR(20)` | FK → users, NOT NULL | |
| `valid_from` | `DATE` | NOT NULL | |
| `valid_to` | `DATE` | | NULL = currently active |
| `shift_start` | `TIME` | NOT NULL | e.g. `06:00` |
| `shift_end` | `TIME` | NOT NULL | e.g. `14:00` |
| `shift_duration_hrs` | `NUMERIC(4,2)` | NOT NULL | DEFAULT `8` |

**Unique constraint:** `(employee_id, valid_from)`

**Example shifts (June 2026)**

| Employee | Shift Start | Shift End |
|---|---|---|
| EMP-1001 | 06:00 | 14:00 |
| EMP-1004 | 07:00 | 15:00 |
| EMP-1005 | 08:00 | 16:00 |
| EMP-1006 | 09:00 | 17:00 |
| EMP-1007 | 10:00 | 18:00 |
| EMP-1009 | 07:30 | 15:30 |
| EMP-1010 | 08:30 | 16:30 |

---

## Operations

### attendance

Daily clock-in / clock-out records for every employee. One row per employee per day.

```sql
CREATE TABLE attendance (
    id           SERIAL            PRIMARY KEY,
    employee_id  VARCHAR(20)       NOT NULL REFERENCES users(id),
    work_date    DATE              NOT NULL,
    status       attendance_status NOT NULL,
    clock_in     TIME,
    clock_out    TIME,
    total_hours  NUMERIC(5,2),
    has_ot       BOOLEAN           NOT NULL DEFAULT FALSE,
    ot_status    VARCHAR(50),
    UNIQUE (employee_id, work_date)
);
```

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `employee_id` | `VARCHAR(20)` | FK → users, NOT NULL | |
| `work_date` | `DATE` | NOT NULL | |
| `status` | `attendance_status` | NOT NULL | `Present` \| `Weekend` \| `Leave` \| `Holiday` |
| `clock_in` | `TIME` | | NULL on Leave / Weekend |
| `clock_out` | `TIME` | | NULL on Leave / Weekend |
| `total_hours` | `NUMERIC(5,2)` | | Computed: `clock_out − clock_in` in hours |
| `has_ot` | `BOOLEAN` | NOT NULL | `TRUE` when `total_hours > 8.75` |
| `ot_status` | `VARCHAR(50)` | | Mirrors manager approval status |

**Unique constraint:** `(employee_id, work_date)`

**OT eligibility rule:** `total_hours > 8.75` (more than 8 hours 45 minutes worked).

**Day status rules:**
- `Present` — regular workday with attendance
- `Weekend` — Saturday or Sunday (Week Off)
- `Leave` — approved leave
- `Holiday` — public holiday (from `public_holidays` table)

---

### ot_records

Core overtime submission table. Stores hours split by type and tracks the dual manager → HR approval workflow. One record per employee per working day.

```sql
CREATE TABLE ot_records (
    id                        SERIAL          PRIMARY KEY,
    employee_id               VARCHAR(20)     NOT NULL REFERENCES users(id),
    manager_id                VARCHAR(20)     NOT NULL REFERENCES users(id),
    work_date                 DATE            NOT NULL,
    clock_in                  TIME            NOT NULL,
    clock_out                 TIME            NOT NULL,
    regular_day_ot            NUMERIC(5,2)    NOT NULL DEFAULT 0,
    non_reg_hrs_ot            NUMERIC(5,2)    NOT NULL DEFAULT 0,
    public_holiday_ot         NUMERIC(5,2)    NOT NULL DEFAULT 0,
    total_ot_approved         NUMERIC(5,2)    NOT NULL DEFAULT 0,
    time_in_lieu              NUMERIC(5,2)    NOT NULL DEFAULT 0,
    pre_approved              BOOLEAN         NOT NULL DEFAULT FALSE,
    manager_status            approval_status NOT NULL DEFAULT 'Pending',
    manager_rejection_comment TEXT,
    manager_approved_at       TIMESTAMPTZ,
    hr_status                 approval_status,
    hr_rejection_comment      TEXT,
    hr_approved_at            TIMESTAMPTZ,
    created_at                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, work_date)
);
```

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `employee_id` | `VARCHAR(20)` | FK → users, NOT NULL | |
| `manager_id` | `VARCHAR(20)` | FK → users, NOT NULL | Line manager at submission time |
| `work_date` | `DATE` | NOT NULL | |
| `clock_in` | `TIME` | NOT NULL | |
| `clock_out` | `TIME` | NOT NULL | |
| `regular_day_ot` | `NUMERIC(5,2)` | NOT NULL | OT hours in **04:00–22:00** window. DEFAULT `0` |
| `non_reg_hrs_ot` | `NUMERIC(5,2)` | NOT NULL | OT hours in **22:00–04:00** window. DEFAULT `0` |
| `public_holiday_ot` | `NUMERIC(5,2)` | NOT NULL | Hours worked on public holiday or week-off. DEFAULT `0` |
| `total_ot_approved` | `NUMERIC(5,2)` | NOT NULL | Manager-confirmed total. DEFAULT `0` |
| `time_in_lieu` | `NUMERIC(5,2)` | NOT NULL | DEFAULT `0` |
| `pre_approved` | `BOOLEAN` | NOT NULL | DEFAULT `FALSE` |
| `manager_status` | `approval_status` | NOT NULL | DEFAULT `'Pending'` |
| `manager_rejection_comment` | `TEXT` | | |
| `manager_approved_at` | `TIMESTAMPTZ` | | |
| `hr_status` | `approval_status` | | **NULL** until manager approves |
| `hr_rejection_comment` | `TEXT` | | |
| `hr_approved_at` | `TIMESTAMPTZ` | | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Auto-updated via trigger |

**Unique constraint:** `(employee_id, work_date)`

**OT hours split logic:**

| Field | Window | Description |
|---|---|---|
| `regular_day_ot` | 04:00 – 22:00 | Standard overtime rate |
| `non_reg_hrs_ot` | 22:00 – 04:00 | Non-regular hours overtime rate |
| `public_holiday_ot` | Any | All hours worked on public holidays or week-off days |

**Manager OT cap rules:**
- Regular workday: manager cannot approve more than `clock_out − clock_in − 8h`
- Holiday / week-off record (`public_holiday_ot > 0` and `regular_day_ot = 0`): full worked hours are eligible, no 8h deduction

**Approval workflow:**

```
Employee submits → manager_status: Pending
    ↓ Manager approves
manager_status: Approved → hr_status: Pending
    ↓ HR approves
hr_status: Approved  (record included in payroll export)
```

---

### ot_pay_calculations

Immutable pay snapshots generated when an OT record is HR-approved. Stores the rates at the time of calculation so future grade changes do not alter historical pay.

```sql
CREATE TABLE ot_pay_calculations (
    id                  SERIAL        PRIMARY KEY,
    ot_record_id        INT           NOT NULL REFERENCES ot_records(id),
    calculated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    gross_pay_monthly   NUMERIC(10,2) NOT NULL,
    gross_pay_per_hour  NUMERIC(10,4) NOT NULL,
    basic_pay_monthly   NUMERIC(10,2) NOT NULL,
    basic_pay_per_hour  NUMERIC(10,4) NOT NULL,
    regular_ot_pay      NUMERIC(10,2) NOT NULL DEFAULT 0,
    non_reg_ot_pay      NUMERIC(10,2) NOT NULL DEFAULT 0,
    holiday_ot_pay      NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_ot_pay        NUMERIC(10,2) NOT NULL DEFAULT 0
);
```

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `ot_record_id` | `INT` | FK → ot_records, NOT NULL | |
| `calculated_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT `NOW()` |
| `gross_pay_monthly` | `NUMERIC(10,2)` | NOT NULL | Grade gross pay at time of calculation |
| `gross_pay_per_hour` | `NUMERIC(10,4)` | NOT NULL | `gross × 12 / 365 / 8` |
| `basic_pay_monthly` | `NUMERIC(10,2)` | NOT NULL | `gross × 0.88` |
| `basic_pay_per_hour` | `NUMERIC(10,4)` | NOT NULL | `basic × 12 / 365 / 8` |
| `regular_ot_pay` | `NUMERIC(10,2)` | NOT NULL | `regular_day_ot × gross_per_hr × 1.5` |
| `non_reg_ot_pay` | `NUMERIC(10,2)` | NOT NULL | `non_reg_hrs_ot × gross_per_hr × 1.5` |
| `holiday_ot_pay` | `NUMERIC(10,2)` | NOT NULL | `(hrs × gross_per_hr) + (hrs × basic_per_hr × 0.5)` |
| `total_ot_pay` | `NUMERIC(10,2)` | NOT NULL | Sum of all three pay components |

---

### payroll_exports

Audit trail of every CSV payroll export triggered by HR.

```sql
CREATE TABLE payroll_exports (
    id            SERIAL       PRIMARY KEY,
    exported_by   VARCHAR(20)  NOT NULL REFERENCES users(id),
    export_month  DATE         NOT NULL,
    exported_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    record_count  INT          NOT NULL DEFAULT 0,
    file_name     VARCHAR(500)
);
```

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `exported_by` | `VARCHAR(20)` | FK → users, NOT NULL | HR user who triggered the export |
| `export_month` | `DATE` | NOT NULL | First day of the payroll month |
| `exported_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT `NOW()` |
| `record_count` | `INT` | NOT NULL | Number of OT records included. DEFAULT `0` |
| `file_name` | `VARCHAR(500)` | | Original downloaded filename |

---

## Indexes

```sql
CREATE INDEX idx_attendance_employee_date   ON attendance  (employee_id, work_date);
CREATE INDEX idx_attendance_date            ON attendance  (work_date);
CREATE INDEX idx_ot_records_employee        ON ot_records  (employee_id);
CREATE INDEX idx_ot_records_manager         ON ot_records  (manager_id);
CREATE INDEX idx_ot_records_date            ON ot_records  (work_date);
CREATE INDEX idx_ot_records_manager_status  ON ot_records  (manager_status);
CREATE INDEX idx_ot_records_hr_status       ON ot_records  (hr_status);
CREATE INDEX idx_users_manager              ON users       (manager_id);
CREATE INDEX idx_users_role                 ON users       (role);
```

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `idx_attendance_employee_date` | `attendance` | `(employee_id, work_date)` | Monthly attendance lookups per employee |
| `idx_attendance_date` | `attendance` | `(work_date)` | Cross-employee daily queries |
| `idx_ot_records_employee` | `ot_records` | `(employee_id)` | Employee OT history |
| `idx_ot_records_manager` | `ot_records` | `(manager_id)` | Manager approval queue |
| `idx_ot_records_date` | `ot_records` | `(work_date)` | Monthly payroll range scans |
| `idx_ot_records_manager_status` | `ot_records` | `(manager_status)` | Filter pending manager approvals |
| `idx_ot_records_hr_status` | `ot_records` | `(hr_status)` | Filter pending HR approvals |
| `idx_users_manager` | `users` | `(manager_id)` | Fetch direct reports |
| `idx_users_role` | `users` | `(role)` | Filter by role |

---

## Pay Formulas

### Hourly Rate Derivation

```
gross_pay_per_hour  = (gross_pay_monthly × 12) / 365 / 8
basic_pay_monthly   = gross_pay_monthly × 0.88
basic_pay_per_hour  = (basic_pay_monthly × 12) / 365 / 8
```

### OT Pay Components

| Type | Formula | Window |
|---|---|---|
| Regular OT | `regular_day_ot × gross_pay_per_hour × 1.5` | 04:00 – 22:00 |
| Non-Reg Hrs OT | `non_reg_hrs_ot × gross_pay_per_hour × 1.5` | 22:00 – 04:00 |
| Holiday / Week-Off OT | `(hrs × gross_pay_per_hour) + (hrs × basic_pay_per_hour × 0.5)` | Any |

```
total_ot_pay = regular_ot_pay + non_reg_ot_pay + holiday_ot_pay
```

**Holiday OT breakdown:**  
The formula `(hrs × gross_per_hr) + (hrs × basic_per_hr × 0.5)` equals the gross rate for all holiday hours plus an additional 50% of the basic rate — reflecting the premium for working on a public holiday or week-off.

---

## Seed Data

```sql
-- Entity
INSERT INTO entities (name) VALUES ('Etihad Rail');

-- Departments
INSERT INTO departments (entity_id, name)
SELECT 1, name FROM (VALUES
  ('IT & Systems'),
  ('Infrastructure'),
  ('Operations'),
  ('HSSE'),
  ('Logistics'),
  ('Engineering'),
  ('Procurement'),
  ('Asset Management'),
  ('Human Resources')
) AS t(name);

-- Grades (G12 = 1,000 AED … G1 = 12,000 AED)
INSERT INTO grades (code, gross_pay) VALUES
  ('G1',  12000), ('G2',  11000), ('G3',  10000),
  ('G4',   9000), ('G5',   8000), ('G6',   7000),
  ('G7',   6000), ('G8',   5000), ('G9',   4000),
  ('G10',  3000), ('G11',  2000), ('G12',  1000);

-- Public Holidays
INSERT INTO public_holidays (holiday_date, name) VALUES
  ('2026-06-15', 'Public Holiday');
```

---

## Full DDL

Complete schema in creation order:

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Overtime Management Portal — Full Schema
-- PostgreSQL 14+
-- ─────────────────────────────────────────────────────────────────────────────

-- ENUMs
CREATE TYPE user_role         AS ENUM ('Employee', 'Manager', 'Hr');
CREATE TYPE attendance_status AS ENUM ('Present', 'Weekend', 'Leave', 'Holiday');
CREATE TYPE approval_status   AS ENUM ('Pending', 'Approved', 'Rejected');

-- Reference tables
CREATE TABLE entities (
    id    SERIAL       PRIMARY KEY,
    name  VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE departments (
    id         SERIAL       PRIMARY KEY,
    entity_id  INT          NOT NULL REFERENCES entities(id),
    name       VARCHAR(100) NOT NULL,
    UNIQUE (entity_id, name)
);

CREATE TABLE grades (
    code       VARCHAR(5)    PRIMARY KEY,
    gross_pay  NUMERIC(10,2) NOT NULL
);

CREATE TABLE public_holidays (
    id            SERIAL       PRIMARY KEY,
    holiday_date  DATE         NOT NULL UNIQUE,
    name          VARCHAR(200)
);

-- Users
CREATE TABLE users (
    id              VARCHAR(20)  PRIMARY KEY,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(200) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    role            user_role    NOT NULL,
    job_title       VARCHAR(200),
    entity_id       INT          NOT NULL REFERENCES entities(id),
    department_id   INT          NOT NULL REFERENCES departments(id),
    grade_code      VARCHAR(5)   REFERENCES grades(code),
    manager_id      VARCHAR(20)  REFERENCES users(id),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Shift templates
CREATE TABLE shift_templates (
    id                  SERIAL       PRIMARY KEY,
    employee_id         VARCHAR(20)  NOT NULL REFERENCES users(id),
    valid_from          DATE         NOT NULL,
    valid_to            DATE,
    shift_start         TIME         NOT NULL,
    shift_end           TIME         NOT NULL,
    shift_duration_hrs  NUMERIC(4,2) NOT NULL DEFAULT 8,
    UNIQUE (employee_id, valid_from)
);

-- Attendance
CREATE TABLE attendance (
    id           SERIAL            PRIMARY KEY,
    employee_id  VARCHAR(20)       NOT NULL REFERENCES users(id),
    work_date    DATE              NOT NULL,
    status       attendance_status NOT NULL,
    clock_in     TIME,
    clock_out    TIME,
    total_hours  NUMERIC(5,2),
    has_ot       BOOLEAN           NOT NULL DEFAULT FALSE,
    ot_status    VARCHAR(50),
    UNIQUE (employee_id, work_date)
);

-- OT Records
CREATE TABLE ot_records (
    id                        SERIAL          PRIMARY KEY,
    employee_id               VARCHAR(20)     NOT NULL REFERENCES users(id),
    manager_id                VARCHAR(20)     NOT NULL REFERENCES users(id),
    work_date                 DATE            NOT NULL,
    clock_in                  TIME            NOT NULL,
    clock_out                 TIME            NOT NULL,
    regular_day_ot            NUMERIC(5,2)    NOT NULL DEFAULT 0,
    non_reg_hrs_ot            NUMERIC(5,2)    NOT NULL DEFAULT 0,
    public_holiday_ot         NUMERIC(5,2)    NOT NULL DEFAULT 0,
    total_ot_approved         NUMERIC(5,2)    NOT NULL DEFAULT 0,
    time_in_lieu              NUMERIC(5,2)    NOT NULL DEFAULT 0,
    pre_approved              BOOLEAN         NOT NULL DEFAULT FALSE,
    manager_status            approval_status NOT NULL DEFAULT 'Pending',
    manager_rejection_comment TEXT,
    manager_approved_at       TIMESTAMPTZ,
    hr_status                 approval_status,
    hr_rejection_comment      TEXT,
    hr_approved_at            TIMESTAMPTZ,
    created_at                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, work_date)
);

-- OT Pay Calculations (immutable audit snapshots)
CREATE TABLE ot_pay_calculations (
    id                  SERIAL        PRIMARY KEY,
    ot_record_id        INT           NOT NULL REFERENCES ot_records(id),
    calculated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    gross_pay_monthly   NUMERIC(10,2) NOT NULL,
    gross_pay_per_hour  NUMERIC(10,4) NOT NULL,
    basic_pay_monthly   NUMERIC(10,2) NOT NULL,
    basic_pay_per_hour  NUMERIC(10,4) NOT NULL,
    regular_ot_pay      NUMERIC(10,2) NOT NULL DEFAULT 0,
    non_reg_ot_pay      NUMERIC(10,2) NOT NULL DEFAULT 0,
    holiday_ot_pay      NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_ot_pay        NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Payroll Export Audit Log
CREATE TABLE payroll_exports (
    id            SERIAL       PRIMARY KEY,
    exported_by   VARCHAR(20)  NOT NULL REFERENCES users(id),
    export_month  DATE         NOT NULL,
    exported_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    record_count  INT          NOT NULL DEFAULT 0,
    file_name     VARCHAR(500)
);

-- Indexes
CREATE INDEX idx_attendance_employee_date   ON attendance (employee_id, work_date);
CREATE INDEX idx_attendance_date            ON attendance (work_date);
CREATE INDEX idx_ot_records_employee        ON ot_records (employee_id);
CREATE INDEX idx_ot_records_manager         ON ot_records (manager_id);
CREATE INDEX idx_ot_records_date            ON ot_records (work_date);
CREATE INDEX idx_ot_records_manager_status  ON ot_records (manager_status);
CREATE INDEX idx_ot_records_hr_status       ON ot_records (hr_status);
CREATE INDEX idx_users_manager              ON users      (manager_id);
CREATE INDEX idx_users_role                 ON users      (role);

-- Auto updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ot_records_updated_at
  BEFORE UPDATE ON ot_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Seed Data ─────────────────────────────────────────────────────────────────

INSERT INTO entities (name) VALUES ('Etihad Rail');

INSERT INTO departments (entity_id, name)
SELECT 1, name FROM (VALUES
  ('IT & Systems'), ('Infrastructure'), ('Operations'),
  ('HSSE'), ('Logistics'), ('Engineering'),
  ('Procurement'), ('Asset Management'), ('Human Resources')
) AS t(name);

INSERT INTO grades (code, gross_pay) VALUES
  ('G1',  12000), ('G2',  11000), ('G3',  10000),
  ('G4',   9000), ('G5',   8000), ('G6',   7000),
  ('G7',   6000), ('G8',   5000), ('G9',   4000),
  ('G10',  3000), ('G11',  2000), ('G12',  1000);

INSERT INTO public_holidays (holiday_date, name) VALUES
  ('2026-06-15', 'Public Holiday');
```
