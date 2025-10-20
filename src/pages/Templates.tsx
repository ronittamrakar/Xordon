import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAuth } from '@/lib/mockAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Copy, Edit, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

const Templates = () => {
  const navigate = useNavigate();
  const [templates] = useState([
    {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to {{company}}!',
      category: 'Onboarding',
      lastUsed: '2 days ago',
    },
    {
      id: '2',
      name: 'Product Demo',
      subject: 'See {{product}} in action',
      category: 'Sales',
      lastUsed: '1 week ago',
    },
    {
      id: '3',
      name: 'Follow-up',
      subject: 'Following up on our conversation',
      category: 'Sales',
      lastUsed: '3 days ago',
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
            <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage reusable email templates
            </p>
          </div>
          <Button className="shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create templates to speed up your email creation
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="h-10 w-10 text-primary mb-4" />
                    <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                      {template.category}
                    </span>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Last used {template.lastUsed}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
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

export default Templates;
