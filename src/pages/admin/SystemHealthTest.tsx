import React from 'react';

const SystemHealthTest = () => {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">System Health Test Page</h1>
            <p className="mt-4">If you can see this, the route is working!</p>
            <div className="mt-4 p-4 bg-blue-100 rounded">
                <p>Route: /admin/health</p>
                <p>Component: SystemHealthTest</p>
                <p>Status: ✅ Rendering</p>
            </div>
        </div>
    );
};

export default SystemHealthTest;
