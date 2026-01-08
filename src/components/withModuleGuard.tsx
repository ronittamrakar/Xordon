import React from 'react';
import { ModuleGuard } from './ModuleGuard';

export function withModuleGuard<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    moduleKey: string
) {
    return function WithModuleGuard(props: P) {
        return (
            <ModuleGuard moduleKey={moduleKey}>
                <WrappedComponent {...props} />
            </ModuleGuard>
        );
    };
}
