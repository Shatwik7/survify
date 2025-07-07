
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, Activity, Filter } from 'lucide-react';
import { populationService } from '@/services/api';
import { usePolling } from '@/hooks/usePolling';
import type { Population } from '@/types';

interface PopulationDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  populationId: string | null;
  onCreateSegment: (populationId: string) => void;
}

export const PopulationDetailsModal: React.FC<PopulationDetailsModalProps> = ({
  open,
  onOpenChange,
  populationId,
  onCreateSegment,
}) => {
  const [jobStatus, setJobStatus] = useState<any>(null);

  const { data: population, isLoading } = useQuery({
    queryKey: ['population', populationId],
    queryFn: () => populationService.getById(populationId!),
    enabled: !!populationId && open,
  });

  const { data: populationWithPersons } = useQuery({
    queryKey: ['populationWithPersons', populationId],
    queryFn: () => populationService.getWithPersons(populationId!, 1, 10),
    enabled: !!populationId && open,
  });

  const fetchJobStatus = async () => {
    if (population?.jobId && population.status === 'working') {
      try {
        const status = await populationService.getJobStatus(population.jobId);
        setJobStatus(status);
      } catch (error) {
        console.error('Failed to fetch job status:', error);
      }
    }
  };

  usePolling({
    enabled: open && !!population?.jobId && population?.status === 'working',
    interval: 2000,
    onPoll: fetchJobStatus,
  });

  useEffect(() => {
    if (open && population) {
      fetchJobStatus();
    }
  }, [open, population]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'working':
        return 'bg-yellow-100 text-yellow-800';
      case 'queued':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!population) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            {population.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Progress */}
          <div className="flex items-center gap-4">
            <Badge className={getStatusColor(population.status)}>
              {population.status}
            </Badge>
            {population.status === 'working' && jobStatus && (
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Processing... {jobStatus.progress || 0}%</span>
                </div>
                <Progress value={jobStatus.progress || 0} className="h-2" />
              </div>
            )}
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="segments">Segments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Population Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total People:</span>
                      <span className="font-semibold">{populationWithPersons?.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Job ID:</span>
                      <span className="text-sm font-mono">{population.jobId || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="text-sm">{new Date(population.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span className="text-sm">{new Date(population.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="people" className="space-y-4">
              <div className="space-y-3">
                {populationWithPersons?.persons?.slice(0, 10).map((person) => (
                  <Card key={person.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{person.name || 'N/A'}</h4>
                          <p className="text-sm text-gray-600">{person.email}</p>
                          {person.phone && (
                            <p className="text-sm text-gray-600">{person.phone}</p>
                          )}
                        </div>
                        {person.customFields && Object.keys(person.customFields).length > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-500">Custom Fields: </span>
                            <span>{Object.keys(person.customFields).length}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(populationWithPersons?.total || 0) > 10 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing 10 of {populationWithPersons?.total} people
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="segments" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Create Segments</h3>
                <Button
                  onClick={() => onCreateSegment(population.id)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Create Segment
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Create filtered segments of this population based on custom criteria.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
