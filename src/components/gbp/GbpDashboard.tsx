import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGbpProfiles } from '@/hooks/useGbpProfiles';
import { MapPin, Star, Users, CheckCircle, Clock, AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { ProfileManager } from './ProfileManager';
import { TaskManager } from './TaskManager';

interface GbpDashboardProps {
  organizationId: string;
}

const GbpDashboard: React.FC<GbpDashboardProps> = ({ organizationId }) => {
  const [showProfileManager, setShowProfileManager] = useState(false);
  const { profiles, tasks, loading } = useGbpProfiles(organizationId);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'todo').length;
  const avgCompleteness = profiles.length > 0 
    ? Math.round(profiles.reduce((acc, p) => acc + (p.completeness_score || 0), 0) / profiles.length)
    : 0;

  const getCompletenessColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'in_progress': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Google Business Profile</h2>
          <p className="text-muted-foreground">
            Manage your Google Business Profile presence and optimization
          </p>
        </div>
        <Button onClick={() => setShowProfileManager(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Profile
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Profiles</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completeness</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCompletenessColor(avgCompleteness)}`}>
              {avgCompleteness}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profiles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profiles">Business Profiles</TabsTrigger>
          <TabsTrigger value="tasks">Optimization Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <Card key={profile.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-lg">{profile.business_name}</CardTitle>
                    </div>
                    <Badge variant={profile.completeness_score && profile.completeness_score >= 80 ? "default" : "secondary"}>
                      {profile.completeness_score || 0}% Complete
                    </Badge>
                  </div>
                  <CardDescription>
                    {profile.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Profile Completeness</span>
                      <span className="font-medium">{profile.completeness_score || 0}%</span>
                    </div>
                    <Progress value={profile.completeness_score || 0} className="h-2" />
                  </div>
                  
                  {profile.categories && profile.categories.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Categories</div>
                      <div className="flex flex-wrap gap-1">
                        {profile.categories.slice(0, 2).map((category, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                        {profile.categories.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.categories.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    {profile.last_synced_at 
                      ? `Last synced ${new Date(profile.last_synced_at).toLocaleDateString()}`
                      : 'Never synced'
                    }
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Sync
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Optimize
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {profiles.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No business profiles yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add your first Google Business Profile to start optimization
                </p>
                <Button onClick={() => setShowProfileManager(true)}>
                  Add Business Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TaskManager organizationId={organizationId} tasks={tasks} profiles={profiles} />
        </TabsContent>
      </Tabs>

      <ProfileManager 
        open={showProfileManager}
        onClose={() => setShowProfileManager(false)}
        organizationId={organizationId}
      />
    </div>
  );
};

export default GbpDashboard;