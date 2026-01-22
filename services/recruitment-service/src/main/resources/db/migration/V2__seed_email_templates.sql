-- ============================================================================
-- Seed Email Templates for Recruitment Communications
-- ============================================================================

INSERT INTO email_templates (name, template_type, subject, body, variables) VALUES

-- Application Received Template
('Application Received', 'APPLICATION_RECEIVED',
 'Thank you for your application - {{jobTitle}}',
 E'Dear {{candidateName}},\n\n' ||
 E'Thank you for applying for the {{jobTitle}} position at {{companyName}}.\n\n' ||
 E'We have received your application (Reference: {{applicationReference}}) and our recruitment team will review it carefully.\n\n' ||
 E'What happens next:\n' ||
 E'1. Our team will review your application within 5-7 business days\n' ||
 E'2. If your profile matches our requirements, we will contact you to schedule an initial screening\n' ||
 E'3. You can track your application status through our candidate portal\n\n' ||
 E'If you have any questions, please don''t hesitate to contact us.\n\n' ||
 E'Best regards,\n' ||
 E'{{recruiterName}}\n' ||
 E'{{companyName}} Recruitment Team',
 'candidateName,jobTitle,companyName,applicationReference,recruiterName'),

-- Interview Invitation Template
('Interview Invitation', 'INTERVIEW_INVITATION',
 'Interview Invitation - {{jobTitle}} at {{companyName}}',
 E'Dear {{candidateName}},\n\n' ||
 E'Congratulations! We were impressed with your application for the {{jobTitle}} position and would like to invite you for an interview.\n\n' ||
 E'Interview Details:\n' ||
 E'Date: {{interviewDate}}\n' ||
 E'Time: {{interviewTime}}\n' ||
 E'Duration: {{durationMinutes}} minutes\n' ||
 E'Type: {{interviewType}}\n' ||
 E'Location: {{locationDetails}}\n' ||
 E'{{#if meetingLink}}Meeting Link: {{meetingLink}}{{/if}}\n\n' ||
 E'Interviewer(s): {{interviewerName}}\n\n' ||
 E'Please confirm your attendance by replying to this email or clicking the confirmation link below.\n\n' ||
 E'If this time doesn''t work for you, please let us know and we''ll arrange an alternative.\n\n' ||
 E'Tips for your interview:\n' ||
 E'- Research our company and the role\n' ||
 E'- Prepare examples of your relevant experience\n' ||
 E'- Have questions ready for the interviewer\n' ||
 E'- {{#if locationType eq ''REMOTE''}}Test your camera and microphone beforehand{{/if}}\n\n' ||
 E'Best regards,\n' ||
 E'{{recruiterName}}\n' ||
 E'{{companyName}} Recruitment Team',
 'candidateName,jobTitle,companyName,interviewDate,interviewTime,durationMinutes,interviewType,locationDetails,meetingLink,interviewerName,recruiterName,locationType'),

-- Interview Reminder Template
('Interview Reminder', 'INTERVIEW_REMINDER',
 'Reminder: Your interview tomorrow - {{jobTitle}}',
 E'Dear {{candidateName}},\n\n' ||
 E'This is a friendly reminder about your upcoming interview for the {{jobTitle}} position.\n\n' ||
 E'Interview Details:\n' ||
 E'Date: {{interviewDate}}\n' ||
 E'Time: {{interviewTime}}\n' ||
 E'Duration: {{durationMinutes}} minutes\n' ||
 E'Type: {{interviewType}}\n' ||
 E'Location: {{locationDetails}}\n' ||
 E'{{#if meetingLink}}Meeting Link: {{meetingLink}}{{/if}}\n\n' ||
 E'Interviewer(s): {{interviewerName}}\n\n' ||
 E'Please ensure you are prepared and ready a few minutes before the scheduled time.\n\n' ||
 E'If you need to reschedule or have any questions, please contact us as soon as possible.\n\n' ||
 E'Good luck!\n\n' ||
 E'Best regards,\n' ||
 E'{{recruiterName}}\n' ||
 E'{{companyName}} Recruitment Team',
 'candidateName,jobTitle,interviewDate,interviewTime,durationMinutes,interviewType,locationDetails,meetingLink,interviewerName,recruiterName'),

-- Interview Confirmation Template
('Interview Confirmation', 'INTERVIEW_CONFIRMATION',
 'Interview Confirmed - {{jobTitle}} at {{companyName}}',
 E'Dear {{candidateName}},\n\n' ||
 E'Thank you for confirming your interview for the {{jobTitle}} position.\n\n' ||
 E'Your interview has been confirmed for:\n' ||
 E'Date: {{interviewDate}}\n' ||
 E'Time: {{interviewTime}}\n' ||
 E'Duration: {{durationMinutes}} minutes\n' ||
 E'Location: {{locationDetails}}\n' ||
 E'{{#if meetingLink}}Meeting Link: {{meetingLink}}{{/if}}\n\n' ||
 E'We look forward to meeting you!\n\n' ||
 E'Best regards,\n' ||
 E'{{recruiterName}}\n' ||
 E'{{companyName}} Recruitment Team',
 'candidateName,jobTitle,companyName,interviewDate,interviewTime,durationMinutes,locationDetails,meetingLink,recruiterName'),

-- Offer Letter Template
('Job Offer', 'OFFER_LETTER',
 'Job Offer - {{jobTitle}} at {{companyName}}',
 E'Dear {{candidateName}},\n\n' ||
 E'We are delighted to offer you the position of {{jobTitle}} at {{companyName}}!\n\n' ||
 E'After careful consideration, we believe your skills and experience make you an excellent fit for our team.\n\n' ||
 E'Offer Details:\n' ||
 E'Position: {{jobTitle}}\n' ||
 E'Department: {{departmentName}}\n' ||
 E'Start Date: {{startDate}}\n' ||
 E'Salary: R{{offerSalary}} per annum (Cost to Company)\n' ||
 E'Location: {{location}}\n\n' ||
 E'Benefits include:\n' ||
 E'{{benefits}}\n\n' ||
 E'This offer is valid until {{offerExpiryDate}}. Please review the attached formal offer letter and employment contract for full details.\n\n' ||
 E'To accept this offer, please:\n' ||
 E'1. Sign and return the attached documents\n' ||
 E'2. Confirm your start date\n' ||
 E'3. Provide the required documentation (ID, qualifications, etc.)\n\n' ||
 E'If you have any questions or would like to discuss the offer, please don''t hesitate to contact me.\n\n' ||
 E'We are excited about the possibility of you joining our team!\n\n' ||
 E'Best regards,\n' ||
 E'{{recruiterName}}\n' ||
 E'{{companyName}}',
 'candidateName,jobTitle,companyName,departmentName,startDate,offerSalary,location,benefits,offerExpiryDate,recruiterName'),

-- Rejection Template
('Application Unsuccessful', 'REJECTION',
 'Update on your application - {{jobTitle}}',
 E'Dear {{candidateName}},\n\n' ||
 E'Thank you for taking the time to apply for the {{jobTitle}} position at {{companyName}} and for your interest in joining our team.\n\n' ||
 E'After careful consideration, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current requirements.\n\n' ||
 E'This was a difficult decision as we received many strong applications. We encourage you to apply for future positions that match your skills and experience.\n\n' ||
 E'We appreciate your interest in {{companyName}} and wish you the best in your career search.\n\n' ||
 E'Best regards,\n' ||
 E'{{recruiterName}}\n' ||
 E'{{companyName}} Recruitment Team',
 'candidateName,jobTitle,companyName,recruiterName'),

-- Welcome/Onboarding Template
('Welcome to the Team', 'WELCOME',
 'Welcome to {{companyName}} - Onboarding Information',
 E'Dear {{candidateName}},\n\n' ||
 E'Welcome to {{companyName}}! We are thrilled that you have accepted our offer and will be joining us as {{jobTitle}}.\n\n' ||
 E'Your start date is confirmed for {{startDate}}.\n\n' ||
 E'Onboarding Information:\n' ||
 E'Reporting To: {{managerName}}\n' ||
 E'Department: {{departmentName}}\n' ||
 E'Office Location: {{location}}\n' ||
 E'Start Time: 08:30\n\n' ||
 E'What to bring on your first day:\n' ||
 E'- South African ID or valid passport\n' ||
 E'- Certified copies of your qualifications\n' ||
 E'- Proof of bank account for salary payment\n' ||
 E'- Tax number (if available)\n\n' ||
 E'Before your first day, please complete:\n' ||
 E'1. New employee information form (attached)\n' ||
 E'2. Tax declaration form (attached)\n' ||
 E'3. Banking details form (attached)\n\n' ||
 E'Our HR team will be in touch with more details about your first week.\n\n' ||
 E'If you have any questions before your start date, please contact:\n' ||
 E'{{recruiterName}} - {{recruiterEmail}}\n\n' ||
 E'We look forward to having you on the team!\n\n' ||
 E'Best regards,\n' ||
 E'{{companyName}} HR Team',
 'candidateName,companyName,jobTitle,startDate,managerName,departmentName,location,recruiterName,recruiterEmail');

-- Comments
COMMENT ON TABLE email_templates IS 'Email templates for recruitment communications with South African context';
