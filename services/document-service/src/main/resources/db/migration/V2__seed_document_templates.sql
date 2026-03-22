-- =====================================================
-- Document Templates Seed Data
-- South African Employment Document Templates
-- =====================================================

-- Note: These templates use a placeholder tenant_id (all zeros)
-- which should be copied to each tenant during onboarding

-- Employment Contract - Permanent
INSERT INTO document_templates (
    id, tenant_id, code, name, description, template_type, category,
    content_template, variables, active, version, created_by
) VALUES (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'CONTRACT_PERMANENT',
    'Permanent Employment Contract',
    'Standard permanent employment contract compliant with BCEA',
    'EMPLOYMENT_CONTRACT_PERMANENT',
    'EMPLOYMENT_CONTRACT',
    '# EMPLOYMENT CONTRACT

## BETWEEN

**{{company_name}}** (Registration No: {{company_registration}})
(hereinafter referred to as "the Employer")

AND

**{{employee_full_name}}** (ID No: {{employee_id_number}})
(hereinafter referred to as "the Employee")

---

## 1. COMMENCEMENT AND DURATION

1.1 This contract of employment shall commence on **{{start_date}}** and shall continue indefinitely until terminated in accordance with the provisions of this contract.

1.2 The first **{{probation_period}}** months of employment shall constitute a probation period.

## 2. JOB TITLE AND DUTIES

2.1 The Employee is employed in the position of **{{job_title}}** in the **{{department}}** department.

2.2 The Employee shall report to **{{reports_to}}**.

2.3 The Employee''s duties shall include but not be limited to:
{{job_duties}}

## 3. PLACE OF WORK

3.1 The Employee''s normal place of work shall be **{{work_location}}**.

## 4. HOURS OF WORK

4.1 The Employee''s normal working hours shall be **{{working_hours}}** per week, as follows:
- Monday to Friday: {{daily_hours}}
- The Employer may require the Employee to work reasonable overtime in accordance with the Basic Conditions of Employment Act.

## 5. REMUNERATION

5.1 The Employee shall receive a gross monthly salary of **R{{monthly_salary}}** ({{salary_in_words}}).

5.2 Payment shall be made on the **{{payment_day}}** of each month by direct deposit into the Employee''s nominated bank account.

5.3 The following deductions shall be made from the Employee''s salary:
- PAYE (Pay As You Earn) as required by law
- UIF (Unemployment Insurance Fund) contributions
- Any other statutory deductions

## 6. LEAVE

6.1 **Annual Leave**: {{annual_leave_days}} working days per annum in terms of the BCEA.

6.2 **Sick Leave**: {{sick_leave_days}} days over a 36-month cycle in terms of the BCEA.

6.3 **Family Responsibility Leave**: 3 days per annum in terms of the BCEA.

## 7. TERMINATION

7.1 Either party may terminate this contract by giving the following written notice:
- During probation: {{probation_notice_period}}
- After probation: {{notice_period}}

7.2 The Employer may summarily dismiss the Employee for serious misconduct.

## 8. CONFIDENTIALITY

8.1 The Employee shall not, during or after employment, disclose any confidential information relating to the Employer''s business.

## 9. GENERAL

9.1 This contract is subject to the laws of the Republic of South Africa.

9.2 Any disputes shall be referred to the CCMA in accordance with the Labour Relations Act.

---

**SIGNED** at **{{signing_location}}** on this **{{signing_date}}**

_____________________________
**Employer Representative**
{{employer_signatory}}

_____________________________
**Employee**
{{employee_full_name}}
',
    '[
        {"name": "company_name", "description": "Company legal name"},
        {"name": "company_registration", "description": "Company registration number"},
        {"name": "employee_full_name", "description": "Employee full name"},
        {"name": "employee_id_number", "description": "Employee SA ID number"},
        {"name": "start_date", "description": "Employment start date"},
        {"name": "probation_period", "description": "Probation period in months"},
        {"name": "job_title", "description": "Job title"},
        {"name": "department", "description": "Department name"},
        {"name": "reports_to", "description": "Reporting manager"},
        {"name": "job_duties", "description": "List of job duties"},
        {"name": "work_location", "description": "Work location address"},
        {"name": "working_hours", "description": "Weekly working hours"},
        {"name": "daily_hours", "description": "Daily working hours"},
        {"name": "monthly_salary", "description": "Gross monthly salary"},
        {"name": "salary_in_words", "description": "Salary amount in words"},
        {"name": "payment_day", "description": "Monthly payment day"},
        {"name": "annual_leave_days", "description": "Annual leave days"},
        {"name": "sick_leave_days", "description": "Sick leave days per cycle"},
        {"name": "probation_notice_period", "description": "Notice during probation"},
        {"name": "notice_period", "description": "Notice period after probation"},
        {"name": "signing_location", "description": "Place of signing"},
        {"name": "signing_date", "description": "Date of signing"},
        {"name": "employer_signatory", "description": "Employer representative name"}
    ]',
    TRUE, 1,
    '00000000-0000-0000-0000-000000000000'
);

-- Fixed-Term Employment Contract
INSERT INTO document_templates (
    id, tenant_id, code, name, description, template_type, category,
    content_template, variables, active, version, created_by
) VALUES (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'CONTRACT_FIXED_TERM',
    'Fixed-Term Employment Contract',
    'Fixed-term employment contract compliant with BCEA Section 198B',
    'EMPLOYMENT_CONTRACT_FIXED_TERM',
    'EMPLOYMENT_CONTRACT',
    '# FIXED-TERM EMPLOYMENT CONTRACT

## BETWEEN

**{{company_name}}** (Registration No: {{company_registration}})
(hereinafter referred to as "the Employer")

AND

**{{employee_full_name}}** (ID No: {{employee_id_number}})
(hereinafter referred to as "the Employee")

---

## 1. COMMENCEMENT AND DURATION

1.1 This fixed-term contract shall commence on **{{start_date}}** and shall terminate on **{{end_date}}**.

1.2 The reason for the fixed-term nature of this contract is: **{{reason_for_fixed_term}}**

1.3 In terms of Section 198B of the Labour Relations Act, the Employee has been informed that this position is temporary.

## 2. JOB TITLE AND DUTIES

2.1 The Employee is employed in the position of **{{job_title}}**.

2.2 The Employee''s duties shall include: {{job_duties}}

## 3. REMUNERATION

3.1 The Employee shall receive a gross monthly salary of **R{{monthly_salary}}**.

3.2 The Employee shall be entitled to the same benefits as permanent employees in accordance with Section 198A of the LRA.

## 4. TERMINATION

4.1 This contract shall automatically terminate on the end date specified above.

4.2 Early termination requires **{{notice_period}}** written notice by either party.

4.3 Upon termination, the Employee shall be entitled to a certificate of service.

---

**SIGNED** at **{{signing_location}}** on this **{{signing_date}}**

_____________________________
**Employer**

_____________________________
**Employee**
',
    '[
        {"name": "company_name", "description": "Company legal name"},
        {"name": "company_registration", "description": "Company registration number"},
        {"name": "employee_full_name", "description": "Employee full name"},
        {"name": "employee_id_number", "description": "Employee SA ID number"},
        {"name": "start_date", "description": "Contract start date"},
        {"name": "end_date", "description": "Contract end date"},
        {"name": "reason_for_fixed_term", "description": "Justifiable reason for fixed-term"},
        {"name": "job_title", "description": "Job title"},
        {"name": "job_duties", "description": "List of job duties"},
        {"name": "monthly_salary", "description": "Gross monthly salary"},
        {"name": "notice_period", "description": "Notice period for early termination"},
        {"name": "signing_location", "description": "Place of signing"},
        {"name": "signing_date", "description": "Date of signing"}
    ]',
    TRUE, 1,
    '00000000-0000-0000-0000-000000000000'
);

-- Written Warning Letter
INSERT INTO document_templates (
    id, tenant_id, code, name, description, template_type, category,
    content_template, variables, active, version, created_by
) VALUES (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'WARNING_WRITTEN',
    'Written Warning Letter',
    'Formal written warning in accordance with LRA disciplinary procedures',
    'WARNING_LETTER_WRITTEN',
    'WARNING_LETTER',
    '# WRITTEN WARNING

**Date:** {{date}}

**Employee:** {{employee_name}}
**Employee Number:** {{employee_number}}
**Department:** {{department}}
**Position:** {{job_title}}

---

## RE: WRITTEN WARNING - {{offense_type}}

Dear {{employee_first_name}},

Following the disciplinary hearing held on **{{hearing_date}}**, you were found guilty of the following misconduct:

### Nature of Offense
{{offense_description}}

### Date(s) of Offense
{{offense_date}}

### Previous Warnings
{{previous_warnings}}

### Finding
You have been found guilty of **{{offense_type}}** in terms of the company''s disciplinary code.

### Sanction
You are hereby issued with a **WRITTEN WARNING** which will remain on your record for a period of **{{warning_validity_months}}** months from the date of this letter.

### Expected Improvement
{{expected_improvement}}

### Consequences of Further Misconduct
Should you commit a similar offense during the validity period of this warning, you may face more severe disciplinary action, up to and including dismissal.

### Right to Appeal
You have the right to appeal this decision within **5 working days** of receiving this warning. Appeals should be submitted in writing to **{{appeal_to}}**.

---

**Issued by:**
{{issued_by_name}}
{{issued_by_title}}

**Signature:** _____________________________

**Date:** {{date}}

---

## EMPLOYEE ACKNOWLEDGMENT

I, **{{employee_name}}**, hereby acknowledge receipt of this written warning. My signature does not indicate agreement with the contents, only that I have received a copy.

**Employee Signature:** _____________________________

**Date:** _____________________________

**Witness Signature:** _____________________________

**Witness Name:** _____________________________
',
    '[
        {"name": "date", "description": "Date of warning letter"},
        {"name": "employee_name", "description": "Employee full name"},
        {"name": "employee_first_name", "description": "Employee first name"},
        {"name": "employee_number", "description": "Employee number"},
        {"name": "department", "description": "Department"},
        {"name": "job_title", "description": "Job title"},
        {"name": "hearing_date", "description": "Date of disciplinary hearing"},
        {"name": "offense_type", "description": "Type of offense"},
        {"name": "offense_description", "description": "Detailed description of offense"},
        {"name": "offense_date", "description": "Date(s) when offense occurred"},
        {"name": "previous_warnings", "description": "Details of any previous warnings"},
        {"name": "warning_validity_months", "description": "How long warning remains valid"},
        {"name": "expected_improvement", "description": "Expected behavioral changes"},
        {"name": "appeal_to", "description": "Person/position to appeal to"},
        {"name": "issued_by_name", "description": "Name of person issuing warning"},
        {"name": "issued_by_title", "description": "Title of person issuing warning"}
    ]',
    TRUE, 1,
    '00000000-0000-0000-0000-000000000000'
);

-- Final Written Warning Letter
INSERT INTO document_templates (
    id, tenant_id, code, name, description, template_type, category,
    content_template, variables, active, version, created_by
) VALUES (
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'WARNING_FINAL',
    'Final Written Warning Letter',
    'Final written warning - last step before dismissal',
    'WARNING_LETTER_FINAL',
    'WARNING_LETTER',
    '# FINAL WRITTEN WARNING

**STRICTLY CONFIDENTIAL**

**Date:** {{date}}

**Employee:** {{employee_name}}
**Employee Number:** {{employee_number}}
**Department:** {{department}}
**Position:** {{job_title}}

---

## RE: FINAL WRITTEN WARNING - {{offense_type}}

Dear {{employee_first_name}},

This letter serves as your **FINAL WRITTEN WARNING**.

Following the disciplinary hearing held on **{{hearing_date}}**, and considering your previous disciplinary record, you are hereby placed on final written warning.

### Offense
{{offense_description}}

### Previous Warnings on Record
{{previous_warnings}}

### Sanction
This **FINAL WRITTEN WARNING** will remain on your record for **{{warning_validity_months}}** months.

### IMPORTANT NOTICE
**Any further misconduct during this period will result in DISMISSAL.**

You are required to immediately improve your conduct. The company reserves the right to take further action should you fail to comply.

---

**Issued by:** {{issued_by_name}}, {{issued_by_title}}

**Signature:** _____________________________

---

## ACKNOWLEDGMENT

I acknowledge receipt of this Final Written Warning.

**Employee Signature:** _____________________________  **Date:** _____________

**Witness Signature:** _____________________________  **Name:** _____________
',
    '[
        {"name": "date", "description": "Date of warning"},
        {"name": "employee_name", "description": "Employee full name"},
        {"name": "employee_first_name", "description": "Employee first name"},
        {"name": "employee_number", "description": "Employee number"},
        {"name": "department", "description": "Department"},
        {"name": "job_title", "description": "Job title"},
        {"name": "hearing_date", "description": "Date of disciplinary hearing"},
        {"name": "offense_type", "description": "Type of offense"},
        {"name": "offense_description", "description": "Description of offense"},
        {"name": "previous_warnings", "description": "Previous warnings on record"},
        {"name": "warning_validity_months", "description": "Warning validity period"},
        {"name": "issued_by_name", "description": "Issuer name"},
        {"name": "issued_by_title", "description": "Issuer title"}
    ]',
    TRUE, 1,
    '00000000-0000-0000-0000-000000000000'
);

-- Termination Letter
INSERT INTO document_templates (
    id, tenant_id, code, name, description, template_type, category,
    content_template, variables, active, version, created_by
) VALUES (
    '00000000-0000-0000-0001-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'TERMINATION_LETTER',
    'Termination of Employment Letter',
    'Letter confirming termination of employment',
    'TERMINATION_LETTER',
    'TERMINATION',
    '# TERMINATION OF EMPLOYMENT

**Date:** {{date}}

**To:** {{employee_name}}
**Employee Number:** {{employee_number}}
**Address:** {{employee_address}}

---

Dear {{employee_first_name}},

## RE: TERMINATION OF EMPLOYMENT

This letter serves to confirm the termination of your employment with **{{company_name}}**.

### Termination Details
- **Reason for Termination:** {{termination_reason}}
- **Effective Date:** {{termination_date}}
- **Last Working Day:** {{last_working_day}}

### Final Settlement
You will receive the following in your final payment:
- Outstanding salary up to {{last_working_day}}
- Pro-rata annual leave: {{leave_days_owing}} days (R{{leave_payout}})
- Notice pay (if applicable): R{{notice_pay}}
- Other: {{other_payments}}

**Less deductions:**
- PAYE
- UIF
- Other statutory deductions
- {{other_deductions}}

### Return of Company Property
Please return the following by your last working day:
{{company_property_list}}

### Certificate of Service
A Certificate of Service will be provided upon request.

### Unemployment Insurance Fund (UIF)
Your UIF documentation (UI-19) will be provided to enable you to claim unemployment benefits.

### Reference
{{reference_policy}}

---

Should you have any queries regarding this termination, please contact {{hr_contact}}.

Yours sincerely,

_____________________________
{{signatory_name}}
{{signatory_title}}
{{company_name}}

---

## ACKNOWLEDGMENT

I, **{{employee_name}}**, acknowledge receipt of this termination letter and the final settlement details above.

**Signature:** _____________________________

**Date:** _____________________________
',
    '[
        {"name": "date", "description": "Date of letter"},
        {"name": "employee_name", "description": "Employee full name"},
        {"name": "employee_first_name", "description": "Employee first name"},
        {"name": "employee_number", "description": "Employee number"},
        {"name": "employee_address", "description": "Employee address"},
        {"name": "company_name", "description": "Company name"},
        {"name": "termination_reason", "description": "Reason for termination"},
        {"name": "termination_date", "description": "Effective termination date"},
        {"name": "last_working_day", "description": "Last day of work"},
        {"name": "leave_days_owing", "description": "Leave days to be paid out"},
        {"name": "leave_payout", "description": "Leave payout amount"},
        {"name": "notice_pay", "description": "Notice pay amount if applicable"},
        {"name": "other_payments", "description": "Any other payments"},
        {"name": "other_deductions", "description": "Any other deductions"},
        {"name": "company_property_list", "description": "List of company property to return"},
        {"name": "reference_policy", "description": "Company reference policy statement"},
        {"name": "hr_contact", "description": "HR contact person"},
        {"name": "signatory_name", "description": "Signatory name"},
        {"name": "signatory_title", "description": "Signatory title"}
    ]',
    TRUE, 1,
    '00000000-0000-0000-0000-000000000000'
);

-- Offer Letter
INSERT INTO document_templates (
    id, tenant_id, code, name, description, template_type, category,
    content_template, variables, active, version, created_by
) VALUES (
    '00000000-0000-0000-0001-000000000006',
    '00000000-0000-0000-0000-000000000000',
    'OFFER_LETTER',
    'Employment Offer Letter',
    'Formal job offer letter to successful candidates',
    'OFFER_LETTER',
    'RECRUITMENT',
    '# EMPLOYMENT OFFER

**{{company_letterhead}}**

**Date:** {{date}}

**To:** {{candidate_name}}
**Address:** {{candidate_address}}

---

Dear {{candidate_first_name}},

## RE: OFFER OF EMPLOYMENT - {{job_title}}

We are pleased to offer you the position of **{{job_title}}** at **{{company_name}}**.

### Position Details
- **Job Title:** {{job_title}}
- **Department:** {{department}}
- **Reports To:** {{reports_to}}
- **Start Date:** {{start_date}}
- **Employment Type:** {{employment_type}}
- **Work Location:** {{work_location}}

### Remuneration Package

| Component | Monthly | Annual |
|-----------|---------|--------|
| Basic Salary | R{{monthly_salary}} | R{{annual_salary}} |
{{additional_benefits}}

### Benefits
{{benefits_list}}

### Conditions of Employment
This offer is subject to:
- Successful completion of background verification
- Verification of qualifications
- Medical fitness (if applicable)
- {{additional_conditions}}

### Response Required
Please confirm your acceptance of this offer by signing and returning a copy of this letter by **{{response_deadline}}**.

If you have any questions, please contact {{hr_contact}} at {{hr_email}} or {{hr_phone}}.

We look forward to welcoming you to the team!

Yours sincerely,

_____________________________
{{signatory_name}}
{{signatory_title}}

---

## ACCEPTANCE

I, **{{candidate_name}}**, accept this offer of employment on the terms and conditions stated above.

**Signature:** _____________________________

**Date:** _____________________________
',
    '[
        {"name": "company_letterhead", "description": "Company letterhead text"},
        {"name": "date", "description": "Date of offer"},
        {"name": "candidate_name", "description": "Candidate full name"},
        {"name": "candidate_first_name", "description": "Candidate first name"},
        {"name": "candidate_address", "description": "Candidate address"},
        {"name": "company_name", "description": "Company name"},
        {"name": "job_title", "description": "Job title"},
        {"name": "department", "description": "Department"},
        {"name": "reports_to", "description": "Reporting manager"},
        {"name": "start_date", "description": "Proposed start date"},
        {"name": "employment_type", "description": "Permanent/Fixed-term/Part-time"},
        {"name": "work_location", "description": "Work location"},
        {"name": "monthly_salary", "description": "Monthly salary"},
        {"name": "annual_salary", "description": "Annual salary"},
        {"name": "additional_benefits", "description": "Table rows for additional benefits"},
        {"name": "benefits_list", "description": "List of other benefits"},
        {"name": "additional_conditions", "description": "Any additional conditions"},
        {"name": "response_deadline", "description": "Deadline to accept offer"},
        {"name": "hr_contact", "description": "HR contact name"},
        {"name": "hr_email", "description": "HR email"},
        {"name": "hr_phone", "description": "HR phone number"},
        {"name": "signatory_name", "description": "Signatory name"},
        {"name": "signatory_title", "description": "Signatory title"}
    ]',
    TRUE, 1,
    '00000000-0000-0000-0000-000000000000'
);

-- Leave Application Form
INSERT INTO document_templates (
    id, tenant_id, code, name, description, template_type, category,
    content_template, variables, active, version, created_by
) VALUES (
    '00000000-0000-0000-0001-000000000007',
    '00000000-0000-0000-0000-000000000000',
    'LEAVE_APPLICATION',
    'Leave Application Form',
    'Standard leave application form',
    'LEAVE_APPLICATION',
    'LEAVE_FORM',
    '# LEAVE APPLICATION FORM

## Employee Details
| Field | Value |
|-------|-------|
| Employee Name | {{employee_name}} |
| Employee Number | {{employee_number}} |
| Department | {{department}} |
| Position | {{job_title}} |
| Date of Application | {{application_date}} |

## Leave Request

| Leave Type | {{leave_type}} |
|------------|----------------|
| Start Date | {{start_date}} |
| End Date | {{end_date}} |
| Total Days | {{total_days}} |
| Return to Work Date | {{return_date}} |

### Reason for Leave
{{reason}}

### Leave Balance (as at application date)
| Leave Type | Entitled | Taken | Balance |
|------------|----------|-------|---------|
| Annual Leave | {{annual_entitled}} | {{annual_taken}} | {{annual_balance}} |
| Sick Leave | {{sick_entitled}} | {{sick_taken}} | {{sick_balance}} |
| Family Responsibility | {{family_entitled}} | {{family_taken}} | {{family_balance}} |

### Contact During Leave
{{contact_during_leave}}

### Handover Arrangements
{{handover_arrangements}}

---

## Approvals

### Line Manager
**Name:** {{manager_name}}
**Decision:** ☐ Approved  ☐ Not Approved
**Reason (if not approved):** _________________________________
**Signature:** _____________________ **Date:** _______________

### HR
**Processed by:** _____________________
**Date:** _______________
',
    '[
        {"name": "employee_name", "description": "Employee full name"},
        {"name": "employee_number", "description": "Employee number"},
        {"name": "department", "description": "Department"},
        {"name": "job_title", "description": "Job title"},
        {"name": "application_date", "description": "Date of application"},
        {"name": "leave_type", "description": "Type of leave"},
        {"name": "start_date", "description": "Leave start date"},
        {"name": "end_date", "description": "Leave end date"},
        {"name": "total_days", "description": "Total leave days"},
        {"name": "return_date", "description": "Return to work date"},
        {"name": "reason", "description": "Reason for leave"},
        {"name": "annual_entitled", "description": "Annual leave entitlement"},
        {"name": "annual_taken", "description": "Annual leave taken"},
        {"name": "annual_balance", "description": "Annual leave balance"},
        {"name": "sick_entitled", "description": "Sick leave entitlement"},
        {"name": "sick_taken", "description": "Sick leave taken"},
        {"name": "sick_balance", "description": "Sick leave balance"},
        {"name": "family_entitled", "description": "Family responsibility leave entitlement"},
        {"name": "family_taken", "description": "Family responsibility leave taken"},
        {"name": "family_balance", "description": "Family responsibility leave balance"},
        {"name": "contact_during_leave", "description": "Contact details during leave"},
        {"name": "handover_arrangements", "description": "Work handover arrangements"},
        {"name": "manager_name", "description": "Line manager name"}
    ]',
    TRUE, 1,
    '00000000-0000-0000-0000-000000000000'
);

-- Resignation Acknowledgment
INSERT INTO document_templates (
    id, tenant_id, code, name, description, template_type, category,
    content_template, variables, active, version, created_by
) VALUES (
    '00000000-0000-0000-0001-000000000008',
    '00000000-0000-0000-0000-000000000000',
    'RESIGNATION_ACK',
    'Resignation Acknowledgment Letter',
    'Letter acknowledging receipt of employee resignation',
    'RESIGNATION_ACKNOWLEDGMENT',
    'RESIGNATION',
    '# ACKNOWLEDGMENT OF RESIGNATION

**Date:** {{date}}

**To:** {{employee_name}}
**Employee Number:** {{employee_number}}
**Department:** {{department}}

---

Dear {{employee_first_name}},

## RE: ACKNOWLEDGMENT OF YOUR RESIGNATION

We acknowledge receipt of your resignation letter dated **{{resignation_date}}**.

### Details
- **Position:** {{job_title}}
- **Notice Period:** {{notice_period}}
- **Last Working Day:** {{last_working_day}}

### Exit Process
During your notice period, please:
1. Complete handover of all responsibilities to {{handover_to}}
2. Return all company property including: {{property_to_return}}
3. Schedule an exit interview with HR

### Final Settlement
Your final payment will include:
- Salary up to {{last_working_day}}
- Pro-rata leave pay for unused annual leave
- Any other entitlements

### Documentation
The following will be provided on your last day:
- Certificate of Service
- UI-19 (UIF form)
- IRP5 (when available)

We thank you for your service to **{{company_name}}** and wish you success in your future endeavors.

Yours sincerely,

_____________________________
{{hr_manager_name}}
Human Resources Manager

---

**Copy to:** Employee file
',
    '[
        {"name": "date", "description": "Date of acknowledgment"},
        {"name": "employee_name", "description": "Employee full name"},
        {"name": "employee_first_name", "description": "Employee first name"},
        {"name": "employee_number", "description": "Employee number"},
        {"name": "department", "description": "Department"},
        {"name": "job_title", "description": "Job title"},
        {"name": "resignation_date", "description": "Date resignation was submitted"},
        {"name": "notice_period", "description": "Required notice period"},
        {"name": "last_working_day", "description": "Last day of work"},
        {"name": "handover_to", "description": "Person to hand over to"},
        {"name": "property_to_return", "description": "List of company property"},
        {"name": "company_name", "description": "Company name"},
        {"name": "hr_manager_name", "description": "HR Manager name"}
    ]',
    TRUE, 1,
    '00000000-0000-0000-0000-000000000000'
);

-- Salary Increase Letter
INSERT INTO document_templates (
    id, tenant_id, code, name, description, template_type, category,
    content_template, variables, active, version, created_by
) VALUES (
    '00000000-0000-0000-0001-000000000009',
    '00000000-0000-0000-0000-000000000000',
    'SALARY_INCREASE',
    'Salary Increase Letter',
    'Letter notifying employee of salary increase',
    'SALARY_INCREASE_LETTER',
    'CORRESPONDENCE',
    '# SALARY INCREASE NOTIFICATION

**CONFIDENTIAL**

**Date:** {{date}}

**To:** {{employee_name}}
**Employee Number:** {{employee_number}}
**Department:** {{department}}

---

Dear {{employee_first_name}},

## RE: SALARY ADJUSTMENT

We are pleased to inform you of an adjustment to your remuneration effective **{{effective_date}}**.

### New Remuneration
| | Previous | New | Increase |
|---|----------|-----|----------|
| Monthly Basic | R{{previous_salary}} | R{{new_salary}} | {{increase_percentage}}% |
| Annual Basic | R{{previous_annual}} | R{{new_annual}} | R{{annual_increase}} |

### Reason
{{reason_for_increase}}

### Other Benefits
Your other benefits remain unchanged:
{{other_benefits}}

We value your contribution to **{{company_name}}** and look forward to your continued success.

Yours sincerely,

_____________________________
{{signatory_name}}
{{signatory_title}}

---

## ACKNOWLEDGMENT

I acknowledge receipt of this salary increase notification.

**Signature:** _____________________________ **Date:** _______________
',
    '[
        {"name": "date", "description": "Date of letter"},
        {"name": "employee_name", "description": "Employee full name"},
        {"name": "employee_first_name", "description": "Employee first name"},
        {"name": "employee_number", "description": "Employee number"},
        {"name": "department", "description": "Department"},
        {"name": "effective_date", "description": "Effective date of increase"},
        {"name": "previous_salary", "description": "Previous monthly salary"},
        {"name": "new_salary", "description": "New monthly salary"},
        {"name": "increase_percentage", "description": "Percentage increase"},
        {"name": "previous_annual", "description": "Previous annual salary"},
        {"name": "new_annual", "description": "New annual salary"},
        {"name": "annual_increase", "description": "Annual increase amount"},
        {"name": "reason_for_increase", "description": "Reason for salary increase"},
        {"name": "other_benefits", "description": "List of other benefits"},
        {"name": "company_name", "description": "Company name"},
        {"name": "signatory_name", "description": "Signatory name"},
        {"name": "signatory_title", "description": "Signatory title"}
    ]',
    TRUE, 1,
    '00000000-0000-0000-0000-000000000000'
);

-- Probation Confirmation Letter
INSERT INTO document_templates (
    id, tenant_id, code, name, description, template_type, category,
    content_template, variables, active, version, created_by
) VALUES (
    '00000000-0000-0000-0001-000000000010',
    '00000000-0000-0000-0000-000000000000',
    'PROBATION_CONFIRM',
    'Probation Confirmation Letter',
    'Letter confirming successful completion of probation',
    'OTHER',
    'CORRESPONDENCE',
    '# CONFIRMATION OF PERMANENT EMPLOYMENT

**Date:** {{date}}

**To:** {{employee_name}}
**Employee Number:** {{employee_number}}
**Department:** {{department}}

---

Dear {{employee_first_name}},

## RE: SUCCESSFUL COMPLETION OF PROBATION

We are pleased to confirm that you have successfully completed your probation period.

### Employment Details
- **Position:** {{job_title}}
- **Probation Start Date:** {{probation_start_date}}
- **Probation End Date:** {{probation_end_date}}
- **Confirmation Date:** {{confirmation_date}}
- **Employment Status:** Permanent

### Terms of Employment
Your terms and conditions of employment as per your original contract of employment remain unchanged, with the following updates:
- Notice period: {{new_notice_period}}
- {{other_changes}}

Congratulations on this achievement. We look forward to your continued contribution to the team.

Yours sincerely,

_____________________________
{{manager_name}}
{{manager_title}}

_____________________________
{{hr_name}}
Human Resources
',
    '[
        {"name": "date", "description": "Date of confirmation"},
        {"name": "employee_name", "description": "Employee full name"},
        {"name": "employee_first_name", "description": "Employee first name"},
        {"name": "employee_number", "description": "Employee number"},
        {"name": "department", "description": "Department"},
        {"name": "job_title", "description": "Job title"},
        {"name": "probation_start_date", "description": "Start of probation"},
        {"name": "probation_end_date", "description": "End of probation"},
        {"name": "confirmation_date", "description": "Date of permanent confirmation"},
        {"name": "new_notice_period", "description": "Notice period after probation"},
        {"name": "other_changes", "description": "Any other changes to terms"},
        {"name": "manager_name", "description": "Manager name"},
        {"name": "manager_title", "description": "Manager title"},
        {"name": "hr_name", "description": "HR representative name"}
    ]',
    TRUE, 1,
    '00000000-0000-0000-0000-000000000000'
);
