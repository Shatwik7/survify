
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { populationService } from '@/services/api';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';

interface UploadPopulationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  populationId: string | null;
}

export const UploadPopulationModal: React.FC<UploadPopulationModalProps> = ({
  open,
  onOpenChange,
  populationId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ file, populationId }: { file: File; populationId: string }) => 
      populationService.uploadFile(populationId, file),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Population uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['populations'] });
      setFile(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload population",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !populationId) return;
    uploadMutation.mutate({ file, populationId });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Population Data</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Excel File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              <FileSpreadsheet className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              Upload an Excel file with columns: email, phone, name, and custom fields
            </p>
          </div>
          
          {file && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Selected file:</p>
              <p className="text-sm text-gray-600">{file.name}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending || !file}
            >
              {uploadMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
