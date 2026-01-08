<?php
/**
 * Simple Router Class
 * 
 * Provides a clean, declarative API for defining routes
 * and handling HTTP requests without massive if/else chains.
 */
class Router {
    private array $routes = [];
    private array $middleware = [];
    private ?ServiceContainer $container = null;

    public function __construct(?ServiceContainer $container = null) {
        $this->container = $container;
    }

    /**
     * Register a GET route
     */
    public function get(string $pattern, $handler): void {
        $this->addRoute('GET', $pattern, $handler);
    }

    /**
     * Register a POST route
     */
    public function post(string $pattern, $handler): void {
        $this->addRoute('POST', $pattern, $handler);
    }

    /**
     * Register a PUT route
     */
    public function put(string $pattern, $handler): void {
        $this->addRoute('PUT', $pattern, $handler);
    }

    /**
     * Register a DELETE route
     */
    public function delete(string $pattern, $handler): void {
        $this->addRoute('DELETE', $pattern, $handler);
    }

    /**
     * Register a PATCH route
     */
    public function patch(string $pattern, $handler): void {
        $this->addRoute('PATCH', $pattern, $handler);
    }

    /**
     * Register any HTTP method route
     */
    public function any(string $pattern, $handler): void {
        $this->addRoute('*', $pattern, $handler);
    }

    /**
     * Add a route to the routing table
     */
    private function addRoute(string $method, string $pattern, $handler): void {
        // Convert route pattern to regex
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $pattern);
        $pattern = '#^' . $pattern . '$#';
        
        $this->routes[] = [
            'method' => $method,
            'pattern' => $pattern,
            'handler' => $handler,
            'middleware' => $this->middleware
        ];
    }

    /**
     * Add middleware for subsequent routes
     */
    public function middleware($middleware): Router {
        $clone = clone $this;
        $clone->middleware = array_merge($this->middleware, (array) $middleware);
        return $clone;
    }

    /**
     * Define a route group with common prefix
     */
    public function group(string $prefix, callable $callback): void {
        $previousMiddleware = $this->middleware;
        
        // Create a scoped router
        $groupRouter = new self($this->container);
        $groupRouter->middleware = $this->middleware;
        
        // Execute the group callback
        $callback($groupRouter);
        
        // Merge routes with prefix
        foreach ($groupRouter->routes as $route) {
            $route['pattern'] = str_replace('#^', '#^' . $prefix, $route['pattern']);
            $this->routes[] = $route;
        }
        
        $this->middleware = $previousMiddleware;
    }

    /**
     * Dispatch the request to the appropriate handler
     */
    public function dispatch(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $path = $path ?: '/';

        foreach ($this->routes as $route) {
            // Check method match
            if ($route['method'] !== '*' && $route['method'] !== $method) {
                continue;
            }

            // Check pattern match
            if (preg_match($route['pattern'], $path, $matches)) {
                // Extract named parameters
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                
                // Run middleware
                foreach ($route['middleware'] as $middleware) {
                    if (is_callable($middleware)) {
                        $result = $middleware();
                        if ($result === false) {
                            return; // Middleware stopped the request
                        }
                    }
                }

                // Execute handler
                $this->executeHandler($route['handler'], $params);
                return;
            }
        }

        // No route found
        require_once __DIR__ . '/ResponseHelper.php';
        ResponseHelper::notFound('Route not found');
    }

    /**
     * Execute the route handler
     */
    private function executeHandler($handler, array $params): void {
        if (is_callable($handler)) {
            // Direct callable
            call_user_func_array($handler, $params);
        } elseif (is_string($handler) && strpos($handler, '@') !== false) {
            // Controller@method format
            [$controllerClass, $method] = explode('@', $handler, 2);
            
            // Instantiate controller
            if ($this->container) {
                try {
                    $controller = $this->container->make($controllerClass);
                } catch (Exception $e) {
                    $controller = new $controllerClass();
                }
            } else {
                $controller = new $controllerClass();
            }
            
            // Call method
            call_user_func_array([$controller, $method], $params);
        } elseif (is_array($handler) && count($handler) === 2) {
            // [Controller::class, 'method'] format
            [$controllerClass, $method] = $handler;
            
            if ($this->container) {
                try {
                    $controller = $this->container->make($controllerClass);
                } catch (Exception $e) {
                    $controller = new $controllerClass();
                }
            } else {
                $controller = new $controllerClass();
            }
            
            call_user_func_array([$controller, $method], $params);
        } else {
            throw new Exception('Invalid route handler');
        }
    }

    /**
     * Load routes from a file
     */
    public function loadRoutes(string $file): void {
        if (!file_exists($file)) {
            throw new Exception("Routes file not found: $file");
        }
        
        $router = $this;
        require $file;
    }

    /**
     * Get all registered routes (for debugging)
     */
    public function getRoutes(): array {
        return $this->routes;
    }
}
