
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Upload, 
  UserPlus, 
  MoreHorizontal,
  Trash2,
  Filter,
  Eye,
  FileSpreadsheet,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { populationService } from '@/services/api';
import { UploadPopulationModal } from './UploadPopulationModal';
import { ExcelTemplateModal } from './ExcelTemplateModal';
import { useToast } from '@/hooks/use-toast';
import type { Population } from '@/types';

interface PopulationListProps {
  onAddPerson: (populationId: string) => void;
  onViewDetails: (populationId: string) => void;
  onCreateSegment: (populationId: string) => void;
}

export const PopulationList: React.FC<PopulationListProps> = ({ 
  onAddPerson, 
  onViewDetails, 
  onCreateSegment 
}) => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedPopulationId, setSelectedPopulationId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [populationToDelete, setPopulationToDelete] = useState<Population | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: populations, isLoading, error } = useQuery({
    queryKey: ['populations'],
    queryFn: () => populationService.getAll(),
  });

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

  const handleUploadExcel = (populationId: string) => {
    setSelectedPopulationId(populationId);
    setUploadModalOpen(true);
  };

  const handleDeleteClick = (population: Population) => {
    setPopulationToDelete(population);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!populationToDelete) return;

    try {
      await populationService.delete(populationToDelete.id);
      queryClient.invalidateQueries({ queryKey: ['populations'] });
      toast({
        title: "Population deleted",
        description: `${populationToDelete.name} has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete population. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPopulationToDelete(null);
    }
  };

  // Filter populations based on search term
  const filteredPopulations = populations?.filter(population =>
    population.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    population.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Populations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load populations. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!populations || populations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No populations yet</h3>
          <p className="text-gray-600 mb-4">Create your first population to get started</p>
          <Button onClick={() => setTemplateModalOpen(true)} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            View Excel Template
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredPopulations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPopulations = filteredPopulations.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your Populations</h2>
            <p className="text-gray-600 text-sm">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredPopulations.length)} of {filteredPopulations.length} populations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search populations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTemplateModalOpen(true)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel Template
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentPopulations.map((population) => (
            <Card key={population.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base truncate">{population.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onViewDetails(population.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddPerson(population.id)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Person
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUploadExcel(population.id)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onCreateSegment(population.id)}>
                        <Filter className="h-4 w-4 mr-2" />
                        Create Segment
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteClick(population)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Badge className={`${getStatusColor(population.status)} border font-medium w-fit`}>
                  {population.status.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    Created {new Date(population.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={() => onViewDetails(population.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => onAddPerson(population.id)}
                    className="flex-1 text-xs"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
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
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Population</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{populationToDelete?.name}"? This action cannot be undone and will permanently remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      <UploadPopulationModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        populationId={selectedPopulationId}
      />
      
      <ExcelTemplateModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
      />
    </>
  );
};
