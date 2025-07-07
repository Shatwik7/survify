
import React, { useState } from 'react';
import { Plus, Users, FileSpreadsheet, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PopulationList } from '@/components/PopulationList';
import { CreatePopulationModal } from '@/components/CreatePopulationModal';
import { UploadPopulationModal } from '@/components/UploadPopulationModal';
import { AddPersonModal } from '@/components/AddPersonModal';
import { SegmentationModal } from '@/components/SegmentationModal';
import { useNavigate } from 'react-router-dom';

const Population = () => {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
  const [segmentModalOpen, setSegmentModalOpen] = useState(false);
  const [selectedPopulationId, setSelectedPopulationId] = useState<string | null>(null);

  const handleAddPerson = (populationId: string) => {
    setSelectedPopulationId(populationId);
    setAddPersonModalOpen(true);
  };

  const handleViewDetails = (populationId: string) => {
    navigate(`/dashboard/population/${populationId}`);
  };

  const handleCreateSegment = (populationId: string) => {
    setSelectedPopulationId(populationId);
    setSegmentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Population Management</h1>
          <p className="text-gray-600 mt-1">Create and manage your target populations</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Population
          </Button>
        </div>
      </div>

      {/* Population List */}
      <PopulationList 
        onAddPerson={handleAddPerson}
        onViewDetails={handleViewDetails}
        onCreateSegment={handleCreateSegment}
      />

      {/* Modals */}
      <CreatePopulationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
      
      <UploadPopulationModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        populationId={selectedPopulationId}
      />
      
      <AddPersonModal
        open={addPersonModalOpen}
        onOpenChange={setAddPersonModalOpen}
        populationId={selectedPopulationId}
      />

      <SegmentationModal
        open={segmentModalOpen}
        onOpenChange={setSegmentModalOpen}
        populationId={selectedPopulationId}
      />
    </div>
  );
};

export default Population;
