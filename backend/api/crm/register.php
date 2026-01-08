<?php
// CRM API endpoints registration

// Register CRM routes
$router->get('/crm/dashboard', 'CRMController@getDashboard');
$router->get('/crm/leads', 'CRMController@getLeads');
$router->post('/crm/leads', 'CRMController@createLead');
$router->put('/crm/leads/{id}', 'CRMController@updateLead');
$router->get('/crm/leads/{id}/activities', 'CRMController@getLeadActivities');
$router->post('/crm/leads/{id}/activities', 'CRMController@addLeadActivity');
$router->get('/crm/tasks', 'CRMController@getTasks');
$router->post('/crm/tasks', 'CRMController@createTask');
$router->patch('/crm/tasks/{id}/status', 'CRMController@updateTaskStatus');

?>
