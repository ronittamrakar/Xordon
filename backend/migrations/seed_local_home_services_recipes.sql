-- Seed Local Business and Home Services Automation Recipes
-- Adds 30+ recipes specifically for local businesses and home services verticals

-- Add 'home_services' to target_audience enum if not exists (MySQL will ignore if already there)
-- Note: If this fails, the column may need to be altered separately

INSERT INTO automation_recipes (is_system, name, description, category, target_audience, channels, trigger_type, trigger_config, steps, estimated_duration, difficulty, tags, usage_count, rating, status) VALUES

-- ==================== LOCAL BUSINESS RECIPES ====================

-- Missed Call Text-Back
(1, 'Missed Call Text-Back', 'Instantly text customers who called but didn''t reach you', 'custom', 'local_business', '["sms"]', 'call_missed', '{}', '[{"type":"sms","delay":0,"message":"Hi! Sorry we missed your call. How can we help you today? Reply to this text or call us back at your convenience."}]', 'Instant', 'beginner', '["missed-call","text-back","local"]', 0, 4.9, 'published'),

-- New Lead Instant Response
(1, 'New Lead Instant Response', 'Respond to new leads within seconds with SMS + email combo', 'welcome', 'local_business', '["sms","email"]', 'form_submitted', '{}', '[{"type":"sms","delay":0,"message":"Thanks for reaching out! We received your inquiry and will contact you shortly."},{"type":"email","delay":0,"subject":"Thanks for contacting us!"},{"type":"sms","delay":24,"message":"Hi! Just following up on your inquiry. Do you have any questions we can help with?"}]', '1 day', 'beginner', '["lead-response","instant","local"]', 0, 4.8, 'published'),

-- Google Review Booster
(1, 'Google Review Booster', 'Get more Google reviews with perfectly timed requests', 'review_request', 'local_business', '["sms","email"]', 'appointment_completed', '{}', '[{"type":"sms","delay":2,"message":"Thanks for choosing us! If you had a great experience, would you mind leaving us a quick Google review? [LINK]"},{"type":"email","delay":72,"subject":"How did we do?"},{"type":"sms","delay":168,"message":"Quick reminder: Your review helps other customers find us! [LINK]"}]', '1 week', 'beginner', '["google-review","reviews","local"]', 0, 4.9, 'published'),

-- Appointment Reminder + No-Show Rescue
(1, 'Appointment Reminder + No-Show Rescue', 'Reduce no-shows with smart reminders and rescue missed appointments', 'appointment', 'local_business', '["sms","email"]', 'appointment_scheduled', '{}', '[{"type":"email","delay":0,"subject":"Your Appointment is Confirmed!"},{"type":"sms","delay":0,"message":"Reminder: Your appointment is tomorrow at {{time}}. Reply C to confirm or R to reschedule."},{"type":"sms","delay":0,"message":"See you in 2 hours! If you need to reschedule, please let us know ASAP."}]', '1 day', 'beginner', '["appointment","reminder","no-show"]', 0, 4.8, 'published'),

-- No-Show Follow-Up
(1, 'No-Show Follow-Up Sequence', 'Re-engage customers who missed their appointment', 'appointment', 'local_business', '["sms","email"]', 'appointment_no_show', '{}', '[{"type":"sms","delay":1,"message":"We missed you today! Would you like to reschedule? Reply YES and we''ll find a new time."},{"type":"email","delay":24,"subject":"Let''s Reschedule Your Appointment"},{"type":"sms","delay":72,"message":"Still want to reschedule? We have openings this week. Let us know!"}]', '3 days', 'beginner', '["no-show","reschedule","local"]', 0, 4.6, 'published'),

-- 90-Day Reactivation
(1, '90-Day Customer Reactivation', 'Win back customers who haven''t visited in 90 days', 'reengagement', 'local_business', '["email","sms"]', 'inactive_90_days', '{}', '[{"type":"email","delay":0,"subject":"We Miss You! Here''s a Special Offer"},{"type":"sms","delay":48,"message":"It''s been a while! Come back and enjoy 15% off your next visit. Use code WELCOME15"},{"type":"email","delay":168,"subject":"Last Chance: Your Special Offer Expires Soon"}]', '1 week', 'beginner', '["reactivation","winback","local"]', 0, 4.7, 'published'),

-- Referral Program Launch
(1, 'Referral Program Invite', 'Turn happy customers into referral sources', 'custom', 'local_business', '["email","sms"]', 'order_completed', '{}', '[{"type":"email","delay":168,"subject":"Earn Rewards: Refer a Friend!"},{"type":"sms","delay":336,"message":"Love our service? Refer a friend and you both get $25 off! Share your link: [LINK]"}]', '2 weeks', 'beginner', '["referral","rewards","local"]', 0, 4.5, 'published'),

-- Birthday VIP Treatment
(1, 'Birthday VIP Treatment', 'Make customers feel special on their birthday', 'birthday', 'local_business', '["email","sms"]', 'birthday', '{}', '[{"type":"email","delay":0,"subject":"Your Birthday Gift is Waiting!"},{"type":"sms","delay":0,"message":"Happy Birthday! 🎂 Enjoy a special gift from us - show this text for your surprise!"},{"type":"email","delay":7,"subject":"Don''t Forget Your Birthday Gift!"}]', '2 weeks', 'beginner', '["birthday","vip","local"]', 0, 4.8, 'published'),

-- New Customer Welcome
(1, 'New Customer Welcome (Local)', 'Welcome new customers and set expectations', 'welcome', 'local_business', '["email","sms"]', 'contact_created', '{}', '[{"type":"email","delay":0,"subject":"Welcome to the Family!"},{"type":"sms","delay":24,"message":"Thanks for joining us! Save this number - text us anytime you need help."},{"type":"email","delay":72,"subject":"5 Things You Should Know About Us"}]', '3 days', 'beginner', '["welcome","onboarding","local"]', 0, 4.7, 'published'),

-- Seasonal Promotion
(1, 'Seasonal Promotion Campaign', 'Drive traffic with seasonal offers', 'custom', 'local_business', '["email","sms"]', 'manual', '{}', '[{"type":"email","delay":0,"subject":"Seasonal Special: Limited Time Offer!"},{"type":"sms","delay":72,"message":"Don''t miss out! Our seasonal special ends soon. Book now: [LINK]"},{"type":"email","delay":144,"subject":"Final Hours: Seasonal Special Ending"}]', '6 days', 'beginner', '["seasonal","promotion","local"]', 0, 4.5, 'published'),

-- ==================== HOME SERVICES RECIPES ====================

-- Estimate Follow-Up Sequence
(1, 'Estimate Follow-Up Sequence', 'Convert more estimates into booked jobs', 'nurture', 'home_services', '["email","sms"]', 'estimate_sent', '{}', '[{"type":"email","delay":0,"subject":"Your Estimate is Ready"},{"type":"sms","delay":4,"message":"Hi! Just sent your estimate. Any questions? Reply here or call us."},{"type":"email","delay":48,"subject":"Questions About Your Estimate?"},{"type":"sms","delay":96,"message":"Ready to move forward? We have availability this week. Reply YES to schedule."}]', '4 days', 'intermediate', '["estimate","follow-up","home-services"]', 0, 4.8, 'published'),

-- Job Completed → Review Request
(1, 'Job Completed Review Request', 'Get reviews after completing home service jobs', 'review_request', 'home_services', '["sms","email"]', 'job_completed', '{}', '[{"type":"sms","delay":2,"message":"Thanks for choosing us! How did we do today? Reply with any feedback."},{"type":"email","delay":24,"subject":"How Was Your Experience?"},{"type":"sms","delay":72,"message":"If you''re happy with our work, a Google review would mean the world to us! [LINK]"}]', '3 days', 'beginner', '["review","job-complete","home-services"]', 0, 4.9, 'published'),

-- Maintenance Plan Upsell
(1, 'Maintenance Plan Upsell', 'Upsell maintenance plans after service completion', 'post_purchase', 'home_services', '["email","sms"]', 'job_completed', '{}', '[{"type":"email","delay":24,"subject":"Protect Your Investment with a Maintenance Plan"},{"type":"sms","delay":72,"message":"Want to avoid future repairs? Ask about our maintenance plans - save 20% when you sign up this week!"},{"type":"email","delay":168,"subject":"Last Chance: Maintenance Plan Discount"}]', '1 week', 'intermediate', '["maintenance","upsell","home-services"]', 0, 4.6, 'published'),

-- HVAC Seasonal Tune-Up
(1, 'HVAC Seasonal Tune-Up Reminder', 'Remind customers about seasonal HVAC maintenance', 'appointment', 'home_services', '["email","sms"]', 'tag_added', '{"tag":"hvac_customer"}', '[{"type":"email","delay":0,"subject":"Time for Your Seasonal HVAC Tune-Up!"},{"type":"sms","delay":48,"message":"Beat the rush! Schedule your HVAC tune-up now and save $50. Book: [LINK]"},{"type":"email","delay":168,"subject":"Don''t Wait: HVAC Season is Coming"}]', '1 week', 'intermediate', '["hvac","seasonal","tune-up"]', 0, 4.7, 'published'),

-- Plumbing Emergency Response
(1, 'Emergency Service Response', 'Respond instantly to emergency service requests', 'custom', 'home_services', '["sms","email"]', 'form_submitted', '{"form_tag":"emergency"}', '[{"type":"sms","delay":0,"message":"We received your emergency request! A technician will call you within 15 minutes."},{"type":"email","delay":0,"subject":"Emergency Service Request Received"}]', 'Instant', 'beginner', '["emergency","urgent","home-services"]', 0, 4.9, 'published'),

-- 6-Month Service Reminder
(1, '6-Month Service Reminder', 'Remind customers to schedule recurring service', 'appointment', 'home_services', '["email","sms"]', 'job_completed', '{}', '[{"type":"email","delay":4320,"subject":"Time for Your 6-Month Service Check"},{"type":"sms","delay":4392,"message":"It''s been 6 months since your last service. Ready to schedule? Reply YES or book online: [LINK]"},{"type":"email","delay":4560,"subject":"Don''t Forget: Schedule Your Service"}]', '6 months', 'intermediate', '["recurring","reminder","home-services"]', 0, 4.6, 'published'),

-- Pest Control Quarterly Reminder
(1, 'Quarterly Pest Control Reminder', 'Keep pest control customers on schedule', 'appointment', 'home_services', '["sms","email"]', 'job_completed', '{}', '[{"type":"email","delay":2016,"subject":"Your Quarterly Pest Control is Due"},{"type":"sms","delay":2088,"message":"Time for your quarterly pest treatment! Book your appointment: [LINK]"},{"type":"sms","delay":2160,"message":"Last reminder: Your pest control treatment is overdue. Protect your home - schedule now!"}]', '3 months', 'intermediate', '["pest-control","quarterly","home-services"]', 0, 4.7, 'published'),

-- Roofing Inspection Follow-Up
(1, 'Roofing Inspection Follow-Up', 'Convert roof inspections into repair/replacement jobs', 'nurture', 'home_services', '["email","sms"]', 'form_submitted', '{}', '[{"type":"email","delay":0,"subject":"Your Free Roof Inspection is Scheduled"},{"type":"email","delay":24,"subject":"What to Expect During Your Roof Inspection"},{"type":"sms","delay":48,"message":"Roof inspection complete! Check your email for the full report and recommendations."},{"type":"email","delay":72,"subject":"Your Roof Inspection Report"},{"type":"sms","delay":168,"message":"Questions about your roof report? We''re here to help. Reply or call us."}]', '1 week', 'intermediate', '["roofing","inspection","home-services"]', 0, 4.5, 'published'),

-- Cleaning Service Rebooking
(1, 'Cleaning Service Rebooking', 'Get cleaning customers to rebook their next appointment', 'post_purchase', 'home_services', '["sms","email"]', 'job_completed', '{}', '[{"type":"sms","delay":2,"message":"Thanks for choosing us! Ready to book your next cleaning? Reply with your preferred date."},{"type":"email","delay":168,"subject":"Book Your Next Cleaning & Save 10%"},{"type":"sms","delay":336,"message":"Miss that fresh, clean feeling? Book your next cleaning now: [LINK]"}]', '2 weeks', 'beginner', '["cleaning","rebooking","home-services"]', 0, 4.7, 'published'),

-- Landscaping Seasonal Prep
(1, 'Landscaping Seasonal Prep', 'Promote seasonal landscaping services', 'custom', 'home_services', '["email","sms"]', 'tag_added', '{"tag":"landscaping_customer"}', '[{"type":"email","delay":0,"subject":"Get Your Yard Ready for the Season"},{"type":"sms","delay":48,"message":"Spring is here! Book your seasonal cleanup and get 15% off. Reply YES to schedule."},{"type":"email","delay":168,"subject":"Limited Spots: Seasonal Landscaping Services"}]', '1 week', 'beginner', '["landscaping","seasonal","home-services"]', 0, 4.6, 'published'),

-- Garage Door Annual Maintenance
(1, 'Garage Door Annual Maintenance', 'Remind customers about annual garage door service', 'appointment', 'home_services', '["email","sms"]', 'job_completed', '{}', '[{"type":"email","delay":8640,"subject":"Your Annual Garage Door Maintenance is Due"},{"type":"sms","delay":8712,"message":"It''s been a year! Time for your garage door tune-up. Book now and save $25: [LINK]"}]', '1 year', 'beginner', '["garage-door","annual","home-services"]', 0, 4.5, 'published'),

-- Pool Service Season Opener
(1, 'Pool Service Season Opener', 'Get pool customers ready for swim season', 'custom', 'home_services', '["email","sms"]', 'manual', '{}', '[{"type":"email","delay":0,"subject":"Pool Season is Almost Here!"},{"type":"sms","delay":48,"message":"Ready to open your pool? Book your pool opening service now - spots are filling fast!"},{"type":"email","delay":168,"subject":"Last Chance: Book Your Pool Opening"}]', '1 week', 'beginner', '["pool","seasonal","home-services"]', 0, 4.6, 'published'),

-- Electrician Safety Check
(1, 'Electrical Safety Check Promo', 'Promote electrical safety inspections', 'custom', 'home_services', '["email","sms"]', 'tag_added', '{"tag":"homeowner"}', '[{"type":"email","delay":0,"subject":"Is Your Home Electrically Safe?"},{"type":"sms","delay":72,"message":"Protect your family! Book a home electrical safety check - $99 this month only."},{"type":"email","delay":168,"subject":"Electrical Safety: What Every Homeowner Should Know"}]', '1 week', 'intermediate', '["electrical","safety","home-services"]', 0, 4.5, 'published'),

-- Window Cleaning Seasonal
(1, 'Window Cleaning Seasonal Push', 'Promote seasonal window cleaning services', 'custom', 'home_services', '["email","sms"]', 'manual', '{}', '[{"type":"email","delay":0,"subject":"Crystal Clear Windows for Spring!"},{"type":"sms","delay":48,"message":"Spring cleaning? Don''t forget your windows! Book now and get 20% off exterior windows."},{"type":"email","delay":120,"subject":"See the Difference: Professional Window Cleaning"}]', '5 days', 'beginner', '["window-cleaning","seasonal","home-services"]', 0, 4.4, 'published'),

-- Appliance Repair Follow-Up
(1, 'Appliance Repair Follow-Up', 'Follow up after appliance repairs', 'post_purchase', 'home_services', '["sms","email"]', 'job_completed', '{}', '[{"type":"sms","delay":24,"message":"How is your {{appliance}} working? Let us know if you have any issues!"},{"type":"email","delay":72,"subject":"Your Appliance Repair: Any Questions?"},{"type":"sms","delay":168,"message":"Happy with your repair? A quick review would help us a lot! [LINK]"}]', '1 week', 'beginner', '["appliance","repair","home-services"]', 0, 4.6, 'published'),

-- Handyman Service Bundle
(1, 'Handyman Service Bundle Promo', 'Promote bundled handyman services', 'custom', 'home_services', '["email","sms"]', 'job_completed', '{}', '[{"type":"email","delay":48,"subject":"Got More Projects? Save with Our Service Bundle"},{"type":"sms","delay":120,"message":"Need more work done? Book 3+ services and save 15%. What else can we help with?"}]', '5 days', 'beginner', '["handyman","bundle","home-services"]', 0, 4.5, 'published'),

-- Carpet Cleaning Reminder
(1, 'Carpet Cleaning Annual Reminder', 'Remind customers about annual carpet cleaning', 'appointment', 'home_services', '["email","sms"]', 'job_completed', '{}', '[{"type":"email","delay":8640,"subject":"Time for Your Annual Carpet Cleaning"},{"type":"sms","delay":8712,"message":"It''s been a year! Your carpets are due for a deep clean. Book now: [LINK]"},{"type":"email","delay":8880,"subject":"Don''t Wait: Dirty Carpets Affect Air Quality"}]', '1 year', 'beginner', '["carpet","annual","home-services"]', 0, 4.6, 'published'),

-- Pressure Washing Seasonal
(1, 'Pressure Washing Seasonal Promo', 'Promote pressure washing services', 'custom', 'home_services', '["email","sms"]', 'manual', '{}', '[{"type":"email","delay":0,"subject":"Restore Your Home''s Curb Appeal"},{"type":"sms","delay":48,"message":"Driveway looking dirty? Get 25% off pressure washing this week only!"},{"type":"email","delay":120,"subject":"Before & After: See the Power of Pressure Washing"}]', '5 days', 'beginner', '["pressure-washing","seasonal","home-services"]', 0, 4.5, 'published'),

-- Locksmith Emergency Follow-Up
(1, 'Locksmith Service Follow-Up', 'Follow up after locksmith services', 'post_purchase', 'home_services', '["sms","email"]', 'job_completed', '{}', '[{"type":"sms","delay":1,"message":"Thanks for calling us! Is everything working properly with your locks?"},{"type":"email","delay":24,"subject":"Your Lock Service: Tips for Home Security"},{"type":"sms","delay":168,"message":"Need spare keys or security upgrades? We offer 10% off for returning customers!"}]', '1 week', 'beginner', '["locksmith","security","home-services"]', 0, 4.6, 'published'),

-- Gutter Cleaning Seasonal
(1, 'Gutter Cleaning Seasonal Reminder', 'Remind customers about seasonal gutter cleaning', 'appointment', 'home_services', '["email","sms"]', 'tag_added', '{"tag":"gutter_customer"}', '[{"type":"email","delay":0,"subject":"Fall is Coming: Time to Clean Your Gutters"},{"type":"sms","delay":48,"message":"Prevent water damage! Book your fall gutter cleaning now - spots filling fast."},{"type":"email","delay":168,"subject":"Why Gutter Cleaning Matters (Before It''s Too Late)"}]', '1 week', 'beginner', '["gutter","seasonal","home-services"]', 0, 4.7, 'published');
