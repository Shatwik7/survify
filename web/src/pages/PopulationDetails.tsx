import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Calendar, 
  Activity, 
  Filter, 
  ArrowLeft, 
  UserPlus,
  Upload,
  RefreshCw
} from 'lucide-react';
import { populationService } from '@/services/api';
import { usePolling } from '@/hooks/usePolling';
import { SegmentationModal } from '@/components/SegmentationModal';
import { AddPersonModal } from '@/components/AddPersonModal';
import { EditPersonModal } from '@/components/EditPersonModal';
import { UploadPopulationModal } from '@/components/UploadPopulationModal';
import { PeopleGrid } from '@/components/PeopleGrid';
import { FilteredPeopleTab } from '@/components/FilteredPeopleTab';
import { useToast } from '@/hooks/use-toast';
import type { Population, Person } from '@/types';

const PopulationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [segmentModalOpen, setSegmentModalOpen] = useState(false);
  const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
  const [editPersonModalOpen, setEditPersonModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);

  const { data: population, isLoading, refetch } = useQuery({
    queryKey: ['population', id],
    queryFn: () => populationService.getById(id!),
    enabled: !!id,
  });

  const { data: populationWithPersons, refetch: refetchPersons } = useQuery({
    queryKey: ['populationWithPersons', id, currentPage],
    queryFn: () => populationService.getWithPersons(id!, currentPage, itemsPerPage),
    enabled: !!id,
  });

  const fetchJobStatus = async () => {
    if (population?.jobId && population.status === 'working') {
      try {
        const status = await populationService.getJobStatus(population.jobId);
        setJobStatus(status);
        
        // If the job is completed, refetch population data
        if (status.finishedOn) {
          refetch();
          refetchPersons();
        }
      } catch (error) {
        console.error('Failed to fetch job status:', error);
      }
    }
  };

  // Poll for job status every 3 seconds for working populations
  usePolling({
    enabled: !!population?.jobId && population?.status === 'working',
    interval: 3000,
    onPoll: fetchJobStatus,
  });

  useEffect(() => {
    if (population) {
      fetchJobStatus();
    }
  }, [population]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'working':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'queued':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalPages = populationWithPersons ? Math.ceil(populationWithPersons.total / itemsPerPage) : 0;

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const deletePersonMutation = useMutation({
    mutationFn: ({ populationId, personId }: { populationId: string; personId: string }) =>
      populationService.deletePerson(populationId, personId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Person deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['populationWithPersons'] });
      setDeleteDialogOpen(false);
      setPersonToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete person",
        variant: "destructive",
      });
    },
  });

  const handleEditPerson = (person: Person) => {
    setPersonToEdit(person);
    setEditPersonModalOpen(true);
  };

  const handleDeletePerson = (person: Person) => {
    setPersonToDelete(person);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePerson = () => {
    if (personToDelete && id) {
      deletePersonMutation.mutate({
        populationId: id,
        personId: personToDelete.id,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!population) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Population not found</h2>
        <Button onClick={() => navigate('/dashboard/population')}>
          Go back to populations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/dashboard/population')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Populations
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8" />
            {population.name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAddPersonModalOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Person
          </Button>
          <Button
            variant="outline"
            onClick={() => setUploadModalOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Excel
          </Button>
          <Button onClick={() => setSegmentModalOpen(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Create Segment
          </Button>
        </div>
      </div>

      {/* Status and Progress */}
      <div className="flex items-center gap-4">
        <Badge className={`${getStatusColor(population.status)} border font-medium`}>
          {population.status.toUpperCase()}
        </Badge>
        {population.status === 'working' && jobStatus && (
          <div className="flex-1 max-w-md">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Processing... {jobStatus.progress || 0}%</span>
              <RefreshCw className="h-3 w-3 animate-spin" />
            </div>
            <Progress value={jobStatus.progress || 0} className="h-2" />
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="people">People ({populationWithPersons?.total || 0})</TabsTrigger>
          <TabsTrigger value="filter">Filter People</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Population Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total People:</span>
                  <span className="font-semibold">{populationWithPersons?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge className={getStatusColor(population.status)}>
                    {population.status}
                  </Badge>
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
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-sm">{new Date(population.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated:</span>
                  <span className="text-sm">{new Date(population.updatedAt).toLocaleDateString()}</span>
                </div>
                {jobStatus?.processedOn && (
                  <div className="flex justify-between">
                    <span>Processed:</span>
                    <span className="text-sm">{new Date(jobStatus.processedOn).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {population.status === 'working' && jobStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Processing Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span className="font-semibold">{jobStatus.progress || 0}%</span>
                  </div>
                  <Progress value={jobStatus.progress || 0} className="h-2" />
                  {jobStatus.processedOn && (
                    <div className="text-sm text-gray-600">
                      Started: {new Date(jobStatus.processedOn).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="people" className="space-y-6">
          <PeopleGrid 
            people={populationWithPersons?.persons || []} 
            total={populationWithPersons?.total || 0}
            onEdit={handleEditPerson}
            onDelete={handleDeletePerson}
          />

          {/* Pagination for People */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => goToPage(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => goToPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => goToPage(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>

        <TabsContent value="filter" className="space-y-6">
          <FilteredPeopleTab populationId={id!} />
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Population Segments</h3>
            <p className="text-gray-600 mb-6">
              Create filtered segments of this population based on custom criteria.
            </p>
            <Button onClick={() => setSegmentModalOpen(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Create Segment
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Person Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Person</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{personToDelete?.name || personToDelete?.email}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePerson}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      <SegmentationModal
        open={segmentModalOpen}
        onOpenChange={setSegmentModalOpen}
        populationId={id || null}
      />
      
      <AddPersonModal
        open={addPersonModalOpen}
        onOpenChange={setAddPersonModalOpen}
        populationId={id || null}
      />
      
      <UploadPopulationModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        populationId={id || null}
      />
      
      <EditPersonModal
        open={editPersonModalOpen}
        onOpenChange={setEditPersonModalOpen}
        populationId={id || null}
        person={personToEdit}
      />
    </div>
  );
};

export default PopulationDetails;
