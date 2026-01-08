# Operations Module - Testing Checklist

## Backend API Endpoints Testing

### ✅ Playbooks
- [ ] GET `/operations/playbooks` - List all playbooks
- [ ] POST `/operations/playbooks` - Create new playbook
- [ ] PUT `/operations/playbooks/:id` - Update playbook
- [ ] DELETE `/operations/playbooks/:id` - Delete playbook

### ✅ Jobs
- [ ] GET `/operations/jobs` - List all jobs
- [ ] GET `/operations/jobs/:id` - Get single job
- [ ] GET `/operations/jobs/:id/history` - Get job status history
- [ ] POST `/operations/jobs` - Create new job
- [ ] PUT `/operations/jobs/:id` - Update job
- [ ] DELETE `/operations/jobs/:id` - Delete job

### ✅ Estimates
- [ ] GET `/operations/estimates` - List all estimates
- [ ] GET `/operations/estimates/:id` - Get single estimate
- [ ] POST `/operations/estimates` - Create new estimate
- [ ] POST `/operations/estimates/:id/convert` - Convert to invoice
- [ ] PUT `/operations/estimates/:id` - Update estimate
- [ ] DELETE `/operations/estimates/:id` - Delete estimate

### ✅ Services
- [ ] GET `/operations/services` - List all services
- [ ] POST `/operations/services` - Create new service
- [ ] PUT `/operations/services/:id` - Update service
- [ ] DELETE `/operations/services/:id` - Delete service

### ✅ Service Categories
- [ ] GET `/operations/service-categories` - List all categories
- [ ] POST `/operations/service-categories` - Create new category
- [ ] PUT `/operations/service-categories/:id` - Update category
- [ ] DELETE `/operations/service-categories/:id` - Delete category

### ✅ Staff
- [ ] GET `/operations/staff` - List all staff
- [ ] POST `/operations/staff` - Create new staff member
- [ ] PUT `/operations/staff/:id` - Update staff member
- [ ] DELETE `/operations/staff/:id` - Delete staff member

### ✅ Appointments
- [ ] GET `/operations/appointments` - List all appointments
- [ ] POST `/operations/appointments` - Create new appointment
- [ ] PUT `/operations/appointments/:id` - Update appointment
- [ ] DELETE `/operations/appointments/:id` - Delete appointment

### ✅ Booking Types
- [ ] GET `/operations/booking-types` - List all booking types
- [ ] POST `/operations/booking-types` - Create new booking type
- [ ] PUT `/operations/booking-types/:id` - Update booking type
- [ ] DELETE `/operations/booking-types/:id` - Delete booking type

### ✅ Availability
- [ ] GET `/operations/availability` - Get availability
- [ ] POST `/operations/availability` - Set availability
- [ ] PUT `/operations/availability/:id` - Update availability
- [ ] DELETE `/operations/availability/:id` - Delete availability

### ✅ Booking Page Settings
- [ ] GET `/operations/booking-page-settings` - Get settings
- [ ] PUT `/operations/booking-page-settings` - Update settings

### ✅ Dashboard Stats
- [ ] GET `/operations/dashboard-stats` - Get dashboard statistics

### ✅ Referral Programs
- [ ] GET `/operations/referral-programs` - List all programs
- [ ] POST `/operations/referral-programs` - Create new program
- [ ] PUT `/operations/referral-programs/:id` - Update program
- [ ] DELETE `/operations/referral-programs/:id` - Delete program

### ✅ Referrals
- [ ] GET `/operations/referrals` - List all referrals
- [ ] POST `/operations/referrals` - Create new referral
- [ ] PUT `/operations/referrals/:id` - Update referral

### ✅ Recall Schedules
- [ ] GET `/operations/recall-schedules` - List all schedules
- [ ] POST `/operations/recall-schedules` - Create new schedule
- [ ] PUT `/operations/recall-schedules/:id` - Update schedule
- [ ] DELETE `/operations/recall-schedules/:id` - Delete schedule

### ✅ Contact Recalls
- [ ] GET `/operations/contact-recalls` - List all contact recalls
- [ ] POST `/operations/contact-recalls` - Create new contact recall
- [ ] PUT `/operations/contact-recalls/:id` - Update contact recall

### ✅ Intake Templates
- [ ] GET `/operations/intake-templates` - List all templates
- [ ] POST `/operations/intake-templates` - Create new template
- [ ] PUT `/operations/intake-templates/:id` - Update template
- [ ] DELETE `/operations/intake-templates/:id` - Delete template

### ✅ Intake Submissions
- [ ] GET `/operations/intake-submissions` - List all submissions
- [ ] PUT `/operations/intake-submissions/:id` - Update submission

### ✅ Industry Settings
- [ ] GET `/operations/settings` - Get industry settings
- [ ] PUT `/operations/settings` - Update industry settings

### ✅ Industry Types
- [ ] GET `/operations/types` - Get all industry types

### ✅ Speed to Lead
- [ ] GET `/operations/speed-to-lead` - Get settings
- [ ] PUT `/operations/speed-to-lead` - Update settings

### ✅ Requests
- [ ] GET `/operations/requests` - List all requests
- [ ] POST `/operations/requests` - Create new request
- [ ] GET `/operations/requests/:id` - Get single request
- [ ] PUT `/operations/requests/:id` - Update request
- [ ] DELETE `/operations/requests/:id` - Delete request

### ✅ Payments
- [ ] GET `/operations/payments` - List all payments
- [ ] GET `/operations/payments/settings` - Get payment settings
- [ ] GET `/operations/payments/stats` - Get payment statistics
- [ ] POST `/operations/payments` - Record new payment
- [ ] PUT `/operations/payments/settings` - Update payment settings

### ✅ Payment Links
- [ ] GET `/operations/payment-links` - List all payment links
- [ ] GET `/operations/payment-links/:id` - Get single payment link
- [ ] POST `/operations/payment-links` - Create new payment link
- [ ] PUT `/operations/payment-links/:id` - Update payment link
- [ ] DELETE `/operations/payment-links/:id` - Delete payment link

### ✅ Fulfillment
- [ ] GET `/operations/fulfillment` - List all fulfillments
- [ ] GET `/operations/fulfillment/unfulfilled` - Get unfulfilled orders
- [ ] GET `/operations/fulfillment/stats` - Get fulfillment statistics
- [ ] POST `/operations/fulfillment` - Create new fulfillment
- [ ] PUT `/operations/fulfillment/:id` - Update fulfillment
- [ ] DELETE `/operations/fulfillment/:id` - Delete fulfillment

### ✅ Ecommerce
- [ ] GET `/operations/ecommerce` - List all stores
- [ ] GET `/operations/ecommerce/dashboard` - Get dashboard
- [ ] GET `/operations/ecommerce/:id` - Get single store
- [ ] POST `/operations/ecommerce` - Create new store
- [ ] PUT `/operations/ecommerce/:id` - Update store
- [ ] DELETE `/operations/ecommerce/:id` - Delete store

### ✅ Agency
- [ ] GET `/operations/agency` - List all clients
- [ ] GET `/operations/agency/analytics` - Get cross-client analytics
- [ ] GET `/operations/agency/reports` - Get reports
- [ ] GET `/operations/agency/:id` - Get single client
- [ ] POST `/operations/agency` - Create new client
- [ ] POST `/operations/agency/reports` - Create new report
- [ ] PUT `/operations/agency/:id` - Update client
- [ ] DELETE `/operations/agency/:id` - Delete client

### ✅ Phone Numbers
- [ ] GET `/operations/phone-numbers` - List all phone numbers
- [ ] GET `/operations/phone-numbers/settings` - Get settings
- [ ] GET `/operations/phone-numbers/stats` - Get statistics
- [ ] GET `/operations/phone-numbers/:id` - Get single phone number
- [ ] POST `/operations/phone-numbers` - Purchase new number
- [ ] PUT `/operations/phone-numbers/:id` - Update phone number
- [ ] PUT `/operations/phone-numbers/settings` - Update settings
- [ ] DELETE `/operations/phone-numbers/:id` - Release number

### ✅ Field Service
- [ ] GET `/operations/field-service` - Get statistics
- [ ] GET `/operations/field-service/stats` - Get statistics
- [ ] GET `/operations/field-service/jobs` - List all jobs
- [ ] GET `/operations/field-service/technicians` - List all technicians
- [ ] GET `/operations/field-service/:id` - Get single job
- [ ] POST `/operations/field-service/jobs` - Create new job
- [ ] POST `/operations/field-service/:id/dispatch` - Dispatch job
- [ ] PATCH `/operations/field-service/:id` - Update job
- [ ] DELETE `/operations/field-service/:id` - Delete job

### ✅ Local Payments
- [ ] GET `/operations/local-payments` - Get statistics
- [ ] GET `/operations/local-payments/stats` - Get statistics
- [ ] GET `/operations/local-payments/transactions` - List all transactions
- [ ] GET `/operations/local-payments/terminals` - List all terminals
- [ ] GET `/operations/local-payments/:id` - Get single transaction
- [ ] POST `/operations/local-payments/transactions` - Process transaction
- [ ] POST `/operations/local-payments/terminals` - Add terminal
- [ ] POST `/operations/local-payments/:id/refund` - Refund transaction
- [ ] PUT `/operations/local-payments/terminals/:id` - Update terminal
- [ ] DELETE `/operations/local-payments/terminals/:id` - Delete terminal

## Frontend Pages Testing

### ✅ Operations Dashboard
- [ ] Navigate to `/operations`
- [ ] Verify Insights page loads
- [ ] Check all statistics display correctly

### ✅ Playbooks
- [ ] Navigate to `/operations/playbooks`
- [ ] Search for playbooks
- [ ] Filter by industry, category, type
- [ ] Install a playbook template
- [ ] Verify success/error toasts

### ✅ Jobs
- [ ] Navigate to `/operations/jobs`
- [ ] Create new job
- [ ] Update job status
- [ ] Add line items
- [ ] Delete job

### ✅ Services
- [ ] Navigate to `/operations/services`
- [ ] Create new service
- [ ] Create service category
- [ ] Update service
- [ ] Delete service

### ✅ Staff Members
- [ ] Navigate to `/operations/staff`
- [ ] Add new staff member
- [ ] Update staff member
- [ ] Delete staff member

### ✅ Referrals
- [ ] Navigate to `/operations/referrals`
- [ ] Create referral program
- [ ] Create referral
- [ ] Update referral status

### ✅ Recalls
- [ ] Navigate to `/operations/recalls`
- [ ] Create recall schedule
- [ ] Create contact recall
- [ ] Update recall status

### ✅ Intake Forms
- [ ] Navigate to `/operations/intake-forms`
- [ ] Create intake template
- [ ] View submissions
- [ ] Update submission status

### ✅ Field Service
- [ ] Navigate to `/operations/field-service`
- [ ] View dashboard statistics
- [ ] Create field service job
- [ ] Dispatch job to technician

### ✅ Local Payments
- [ ] Navigate to `/operations/local-payments`
- [ ] View payment statistics
- [ ] Process transaction
- [ ] Add payment terminal

### ✅ GPS Tracking
- [ ] Navigate to `/operations/gps-tracking`
- [ ] View technician locations (mock data)
- [ ] Send job assignment

## Integration Testing

### ✅ Cross-Module Integration
- [ ] Create contact and assign to job
- [ ] Create service and add to estimate
- [ ] Convert estimate to invoice
- [ ] Create job from request
- [ ] Link appointment to job

### ✅ Error Handling
- [ ] Test with invalid data
- [ ] Test with missing required fields
- [ ] Verify error messages display correctly
- [ ] Test network error scenarios

## Performance Testing

### ✅ Load Testing
- [ ] List endpoints with large datasets
- [ ] Pagination works correctly
- [ ] Filtering works efficiently
- [ ] Search is responsive

## Security Testing

### ✅ Authentication
- [ ] All endpoints require authentication (except public)
- [ ] Workspace isolation works correctly
- [ ] User permissions are respected

## Notes

- All endpoints use `/operations` prefix
- All frontend pages use correct API endpoints
- Error handling is consistent across all pages
- Toast notifications work correctly
- Data validation is in place

## Status: ✅ READY FOR TESTING
