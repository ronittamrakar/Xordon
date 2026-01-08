<?php
/**
 * API Routes - Authentication & User Management
 * 
 * Routes for user authentication, registration, and profile management
 */

// Authentication routes
$router->post('/auth/login', 'AuthController@login');
$router->post('/auth/register', 'AuthController@register');
$router->post('/auth/logout', 'AuthController@logout');
$router->post('/auth/refresh', 'AuthController@refresh');
$router->post('/auth/forgot-password', 'AuthController@forgotPassword');
$router->post('/auth/reset-password', 'AuthController@resetPassword');
$router->get('/auth/me', 'AuthController@me');
$router->post('/auth/verify-email', 'AuthController@verifyEmail');
$router->post('/auth/resend-verification', 'AuthController@resendVerification');

// Development only auth routes
if (getenv('APP_ENV') === 'development') {
    $router->post('/auth/dev-token', 'AuthController@devToken');
}


// Company/Workspace Context
$router->get('/auth/companies/allowed', 'AuthController@allowedCompanies');

// User management routes (require authentication)
$router->group('/api/users', function($router) {
    $router->get('', 'UserController@index');
    $router->get('/{id}', 'UserController@show');
    $router->post('', 'UserController@create');
    $router->put('/{id}', 'UserController@update');
    $router->delete('/{id}', 'UserController@delete');
    $router->get('/{id}/permissions', 'UserController@permissions');
    $router->put('/{id}/role', 'UserController@updateRole');
});

// Profile routes
$router->group('/api/profile', function($router) {
    $router->get('', 'UserController@profile');
    $router->put('', 'UserController@updateProfile');
    $router->put('/password', 'UserController@updatePassword');
    $router->post('/avatar', 'UserController@uploadAvatar');
});
