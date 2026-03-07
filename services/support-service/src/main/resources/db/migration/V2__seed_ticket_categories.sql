-- Seed ticket categories

INSERT INTO ticket_categories (code, name, description, assigned_team, subcategories, display_order) VALUES
('HR_REQUESTS', 'HR Requests', 'General HR-related requests and queries', 'HR Team',
 'Name change,Address update,Emergency contacts,Employment verification,Personal details update', 1),

('PAYROLL_BENEFITS', 'Payroll & Benefits', 'Payroll queries and benefits administration', 'Payroll Team',
 'Banking details,Tax info,Benefits enrollment,Payslip queries,Deductions,Bonus queries', 2),

('LEAVE_ATTENDANCE', 'Leave & Attendance', 'Leave requests and attendance corrections', 'Leave Admin',
 'Leave balance queries,Attendance corrections,Public holiday queries,Leave policy questions', 3),

('IT_SUPPORT', 'IT Support', 'Technical support and IT-related issues', 'IT Team',
 'Password reset,Software access,Equipment request,Email issues,Network issues,Hardware problems', 4),

('FACILITIES', 'Facilities', 'Office and facilities management requests', 'Facilities Team',
 'Parking,Access cards,Workspace issues,Building maintenance,Meeting rooms,Office supplies', 5),

('FINANCE', 'Finance', 'Finance-related queries and requests', 'Finance Team',
 'Expense claims,Reimbursements,Budget queries,Invoice queries,Travel allowance', 6),

('OTHER', 'Other', 'General enquiries that don''t fit other categories', 'General Admin',
 'General enquiry,Feedback,Suggestions,Complaints', 7);
