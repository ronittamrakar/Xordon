import React, { useState, useEffect, useRef, ReactNode, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LazyWidgetWrapperProps {
    children: ReactNode;
    id: string;
    fallback?: ReactNode;
    className?: string;
    // Memory optimization props
    preloadOnHover?: boolean;
    delay?: number;
}

/**
 * LazyWidgetWrapper - Optimizes dashboard memory usage by only loading widgets when they're visible
 * Features:
 * - Intersection Observer for viewport detection
 * - Optional hover preloading
 * - Configurable delay for staggered loading
 * - Memory-efficient skeleton states
 */
export const LazyWidgetWrapper: React.FC<LazyWidgetWrapperProps> = ({
    children,
    id,
    fallback,
    className = '',
    preloadOnHover = false,
    delay = 0,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    // Intersection Observer for viewport detection
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        // Apply delay for staggered loading
                        if (delay > 0) {
                            timeoutRef.current = setTimeout(() => {
                                setShouldLoad(true);
                            }, delay);
                        } else {
                            setShouldLoad(true);
                        }
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '100px', // Start loading slightly before entering viewport
                threshold: 0.1,
            }
        );

        if (wrapperRef.current) {
            observer.observe(wrapperRef.current);
        }

        return () => {
            observer.disconnect();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [delay]);

    // Hover preloading
    useEffect(() => {
        if (preloadOnHover && isHovered && !shouldLoad && !isVisible) {
            setShouldLoad(true);
        }
    }, [isHovered, preloadOnHover, shouldLoad, isVisible]);

    // Memory cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    // Default skeleton fallback
    const defaultFallback = (
        <Card className="h-full border-none shadow-xl bg-background/50 backdrop-blur-md overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-40" />
            </div>
            <div className="mt-auto pt-4">
                <Skeleton className="h-16 w-full rounded-lg opacity-50" />
            </div>
        </Card>
    );

    // Render nothing until visible (saves memory)
    if (!isVisible && !isHovered) {
        return (
            <div
                ref={wrapperRef}
                className={`min-h-[200px] ${className}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {fallback || defaultFallback}
            </div>
        );
    }

    // Show skeleton while loading
    if (!shouldLoad) {
        return (
            <div
                ref={wrapperRef}
                className={`min-h-[200px] ${className}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {fallback || defaultFallback}
            </div>
        );
    }

    // Render actual component
    return (
        <div
            ref={wrapperRef}
            className={cn(
                "transition-all duration-500 ease-out",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                className
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Suspense fallback={fallback || defaultFallback}>
                {children}
            </Suspense>
        </div>
    );
};

/**
 * Higher-order component for lazy loading any widget
 */
export function withLazyLoading<P extends object>(
    Component: React.ComponentType<P>,
    displayName?: string,
    fallback?: ReactNode
) {
    const WrappedComponent = (props: P & LazyWidgetWrapperProps) => {
        const { id, preloadOnHover, delay, className, ...componentProps } = props;

        return (
            <LazyWidgetWrapper
                id={id}
                preloadOnHover={preloadOnHover}
                delay={delay}
                className={className}
                fallback={fallback}
            >
                <Component {...(componentProps as P)} />
            </LazyWidgetWrapper>
        );
    };

    WrappedComponent.displayName = `Lazy${displayName || Component.displayName || 'Component'}`;
    return WrappedComponent;
}