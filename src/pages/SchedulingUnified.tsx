import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarCheck, Link, Settings, CreditCard, RefreshCw, Loader2 } from 'lucide-react';

// Lazy load sub-pages
const Appointments = lazy(() => import('./Appointments'));
const Calendars = lazy(() => import('./Calendars'));
const BookingPages = lazy(() => import('./BookingPages'));
const Payments = lazy(() => import('./scheduling/Payments'));
const CalendarSync = lazy(() => import('./scheduling/CalendarSync'));

// Loading fallback
const LoadingComponent = () => (
    <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const SchedulingUnified = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('appointments');

    // Sync tab with URL path
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/scheduling/calendars')) {
            setActiveTab('calendars');
        } else if (path.includes('/scheduling/booking-pages')) {
            setActiveTab('booking-pages');
        } else if (path.includes('/scheduling/payments')) {
            setActiveTab('payments');
        } else if (path.includes('/scheduling/calendar-sync')) {
            setActiveTab('calendar-sync');
        } else {
            // Default to appointments for /scheduling or /scheduling/appointments
            setActiveTab('appointments');
        }
    }, [location.pathname]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        switch (value) {
            case 'appointments':
                navigate('/scheduling/appointments');
                break;
            case 'calendars':
                navigate('/scheduling/calendars');
                break;
            case 'booking-pages':
                navigate('/scheduling/booking-pages');
                break;
            case 'payments':
                navigate('/scheduling/payments');
                break;
            case 'calendar-sync':
                navigate('/scheduling/calendar-sync');
                break;
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="border-b px-6 py-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Scheduling</h1>
                        <p className="text-muted-foreground">Manage your appointments, calendars, and availability</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
                        <TabsTrigger value="appointments" className="flex items-center gap-2">
                            <CalendarCheck className="h-4 w-4" />
                            Appointments
                        </TabsTrigger>
                        <TabsTrigger value="calendars" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Calendars
                        </TabsTrigger>
                        <TabsTrigger value="booking-pages" className="flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            Booking Pages
                        </TabsTrigger>
                        <TabsTrigger value="payments" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payments
                        </TabsTrigger>
                        <TabsTrigger value="calendar-sync" className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Sync
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-[1600px] mx-auto space-y-6">
                    {/* 
                        We conditionally render content based on activeTab 
                        instead of using TabsContent to avoid mounting all components at once 
                        and to ensure proper URL routing behavior.
                    */}

                    {activeTab === 'appointments' && (
                        <div className="animate-in fade-in-50 duration-300">
                            <Suspense fallback={<LoadingComponent />}>
                                <Appointments hideHeader={true} />
                            </Suspense>
                        </div>
                    )}

                    {activeTab === 'calendars' && (
                        <div className="animate-in fade-in-50 duration-300">
                            <Suspense fallback={<LoadingComponent />}>
                                <Calendars hideHeader={true} />
                            </Suspense>
                        </div>
                    )}

                    {activeTab === 'booking-pages' && (
                        <div className="animate-in fade-in-50 duration-300">
                            <Suspense fallback={<LoadingComponent />}>
                                <BookingPages hideHeader={true} />
                            </Suspense>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="animate-in fade-in-50 duration-300">
                            <Suspense fallback={<LoadingComponent />}>
                                <Payments hideHeader={true} />
                            </Suspense>
                        </div>
                    )}

                    {activeTab === 'calendar-sync' && (
                        <div className="animate-in fade-in-50 duration-300">
                            <Suspense fallback={<LoadingComponent />}>
                                <CalendarSync hideHeader={true} />
                            </Suspense>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchedulingUnified;
