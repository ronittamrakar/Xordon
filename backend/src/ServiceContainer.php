<?php
/**
 * Simple Dependency Injection Container
 * 
 * This container manages service instantiation and provides
 * a centralized location for dependency resolution.
 */
class ServiceContainer {
    private static ?ServiceContainer $instance = null;
    private array $services = [];
    private array $singletons = [];
    private $pdo = null;

    private function __construct() {}

    /**
     * Get the singleton instance of the container
     */
    public static function getInstance(): ServiceContainer {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Set the PDO instance for database connections
     */
    public function setPdo(PDO $pdo): void {
        $this->pdo = $pdo;
    }

    /**
     * Get the PDO instance
     */
    public function getPdo(): PDO {
        if ($this->pdo === null) {
            require_once __DIR__ . '/Database.php';
            $this->pdo = Database::conn();
        }
        return $this->pdo;
    }

    /**
     * Register a service factory
     * 
     * @param string $name Service name
     * @param callable $factory Factory function that returns the service instance
     */
    public function register(string $name, callable $factory): void {
        $this->services[$name] = $factory;
    }

    /**
     * Register a singleton service
     * 
     * @param string $name Service name
     * @param callable $factory Factory function that returns the service instance
     */
    public function singleton(string $name, callable $factory): void {
        $this->services[$name] = $factory;
        $this->singletons[$name] = true;
    }

    /**
     * Resolve a service from the container
     * 
     * @param string $name Service name
     * @return mixed Service instance
     * @throws Exception If service not found
     */
    public function get(string $name) {
        if (!isset($this->services[$name])) {
            throw new Exception("Service '$name' not found in container");
        }

        // Return cached singleton if exists
        if (isset($this->singletons[$name]) && isset($this->services[$name . '_instance'])) {
            return $this->services[$name . '_instance'];
        }

        // Create new instance
        $factory = $this->services[$name];
        $instance = $factory($this);

        // Cache singleton
        if (isset($this->singletons[$name])) {
            $this->services[$name . '_instance'] = $instance;
        }

        return $instance;
    }

    /**
     * Check if a service is registered
     */
    public function has(string $name): bool {
        return isset($this->services[$name]);
    }

    /**
     * Create an instance with automatic constructor injection
     * 
     * @param string $className Fully qualified class name
     * @return object Instance of the class
     */
    public function make(string $className): object {
        $reflectionClass = new ReflectionClass($className);
        $constructor = $reflectionClass->getConstructor();

        if ($constructor === null) {
            return new $className();
        }

        $parameters = $constructor->getParameters();
        $dependencies = [];

        foreach ($parameters as $parameter) {
            $type = $parameter->getType();
            
            if ($type === null) {
                // No type hint - try to use default value or null
                if ($parameter->isDefaultValueAvailable()) {
                    $dependencies[] = $parameter->getDefaultValue();
                } else {
                    $dependencies[] = null;
                }
                continue;
            }

            $typeName = $type->getName();

            // Handle PDO dependency
            if ($typeName === 'PDO') {
                $dependencies[] = $this->getPdo();
                continue;
            }

            // Try to resolve from container or instantiate
            if ($this->has($typeName)) {
                $dependencies[] = $this->get($typeName);
            } elseif (class_exists($typeName)) {
                $dependencies[] = $this->make($typeName);
            } else {
                if ($parameter->isDefaultValueAvailable()) {
                    $dependencies[] = $parameter->getDefaultValue();
                } else {
                    throw new Exception("Cannot resolve dependency '$typeName' for class '$className'");
                }
            }
        }

        return $reflectionClass->newInstanceArgs($dependencies);
    }

    /**
     * Clear all services (useful for testing)
     */
    public function clear(): void {
        $this->services = [];
        $this->singletons = [];
        $this->pdo = null;
    }

    /**
     * Bootstrap common services
     */
    public function bootstrap(): void {
        // Register common services as singletons
        $this->singleton('RBACService', function($container) {
            require_once __DIR__ . '/services/RBACService.php';
            return new RBACService($container->getPdo());
        });

        $this->singleton('LeadScoringService', function($container) {
            require_once __DIR__ . '/services/LeadScoringService.php';
            return new LeadScoringService($container->getPdo());
        });

        $this->singleton('SequenceService', function($container) {
            require_once __DIR__ . '/services/SequenceService.php';
            return new SequenceService($container->getPdo());
        });

        $this->singleton('AutomationEngineService', function($container) {
            require_once __DIR__ . '/services/AutomationEngineService.php';
            return new AutomationEngineService($container->getPdo());
        });

        $this->singleton('AiService', function($container) {
            require_once __DIR__ . '/services/AiService.php';
            return new AiService($container->getPdo());
        });

        $this->singleton('OAuthService', function($container) {
            require_once __DIR__ . '/services/OAuthService.php';
            return new OAuthService($container->getPdo());
        });
    }
}
