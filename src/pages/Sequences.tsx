import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAuth } from '@/lib/mockAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, Clock, CheckCircle2, Play } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

const Sequences = () => {
  const navigate = useNavigate();
  const [sequences] = useState([
    {
      id: '1',
      name: 'Welcome Series',
      steps: 3,
      active: true,
      sent: 450,
      opened: 270,
      clicked: 135,
    },
    {
      id: '2',
      name: 'Product Demo Follow-up',
      steps: 5,
      active: true,
      sent: 230,
      opened: 161,
      clicked: 92,
    },
    {
      id: '3',
      name: 'Re-engagement Campaign',
      steps: 4,
      active: false,
      sent: 180,
      opened: 72,
      clicked: 18,
    },
  ]);

  useEffect(() => {
    if (!mockAuth.isAuthenticated()) {
      navigate('/auth');
    }
  }, [navigate]);

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Sequences</h1>
            <p className="text-muted-foreground mt-1">
              Automate follow-ups with multi-step email sequences
            </p>
          </div>
          <Button className="shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Sequence
          </Button>
        </div>

        {sequences.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Zap className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sequences yet</h3>
              <p className="text-muted-foreground mb-4">
                Create automated email sequences to nurture your leads
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Sequence
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sequences.map((sequence) => (
              <Card
                key={sequence.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {sequence.name}
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {sequence.steps} steps
                      </CardDescription>
                    </div>
                    <Badge variant={sequence.active ? 'default' : 'secondary'}>
                      {sequence.active ? (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        'Paused'
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{sequence.sent}</p>
                        <p className="text-xs text-muted-foreground">Sent</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{sequence.opened}</p>
                        <p className="text-xs text-muted-foreground">Opened</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{sequence.clicked}</p>
                        <p className="text-xs text-muted-foreground">Clicked</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Sequences;
