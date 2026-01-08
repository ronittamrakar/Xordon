import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

const STORAGE_KEY = 'xordon_mobile_push_prefs_v1';

const PushNotifications = () => {
  const [jobs, setJobs] = useState(true);
  const [appointments, setAppointments] = useState(true);
  const [messages, setMessages] = useState(true);
  const [payments, setPayments] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        jobs?: boolean;
        appointments?: boolean;
        messages?: boolean;
        payments?: boolean;
      };
      if (typeof parsed.jobs === 'boolean') setJobs(parsed.jobs);
      if (typeof parsed.appointments === 'boolean') setAppointments(parsed.appointments);
      if (typeof parsed.messages === 'boolean') setMessages(parsed.messages);
      if (typeof parsed.payments === 'boolean') setPayments(parsed.payments);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          jobs,
          appointments,
          messages,
          payments,
        })
      );
    } catch {
      // ignore
    }
  }, [jobs, appointments, messages, payments]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Push Notifications</h1>
          <p className="text-muted-foreground">
            Control which events trigger mobile push notifications.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Job updates</Label>
              <p className="text-sm text-muted-foreground">
                Notify technicians on assignment, status change, and new notes.
              </p>
            </div>
            <Switch checked={jobs} onCheckedChange={setJobs} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Appointments</Label>
              <p className="text-sm text-muted-foreground">
                Send reminders and reschedule notifications to mobile.
              </p>
            </div>
            <Switch checked={appointments} onCheckedChange={setAppointments} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Messages</Label>
              <p className="text-sm text-muted-foreground">
                New SMS, email replies, and chat messages.
              </p>
            </div>
            <Switch checked={messages} onCheckedChange={setMessages} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Payments</Label>
              <p className="text-sm text-muted-foreground">
                Payment captured, refunds, and failed charge alerts.
              </p>
            </div>
            <Switch checked={payments} onCheckedChange={setPayments} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PushNotifications;
