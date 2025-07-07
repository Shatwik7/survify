
import React, { useState, useEffect } from 'react';
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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { Person } from '@/types';

interface EditPersonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  populationId: string | null;
  person: Person | null;
}

interface PersonData {
  email: string;
  phone: string;
  name: string;
  customFields: Record<string, string>;
}

export const EditPersonModal: React.FC<EditPersonModalProps> = ({
  open,
  onOpenChange,
  populationId,
  person,
}) => {
  const [personData, setPersonData] = useState<PersonData>({
    email: '',
    phone: '',
    name: '',
    customFields: {},
  });
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (person) {
      setPersonData({
        email: person.email || '',
        phone: person.phone || '',
        name: person.name || '',
        customFields: person.customFields || {},
      });
    }
  }, [person]);

  const updatePersonMutation = useMutation({
    mutationFn: ({ personData, populationId, personId }: { 
      personData: PersonData; 
      populationId: string; 
      personId: string;
    }) => populationService.updatePerson(populationId, personId, personData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Person updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['populationWithPersons'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update person",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!populationId || !person) return;
    updatePersonMutation.mutate({ 
      personData, 
      populationId, 
      personId: person.id 
    });
  };

  const addCustomField = () => {
    if (!customFieldKey.trim() || !customFieldValue.trim()) return;
    
    setPersonData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [customFieldKey]: customFieldValue,
      },
    }));
    setCustomFieldKey('');
    setCustomFieldValue('');
  };

  const removeCustomField = (key: string) => {
    setPersonData(prev => {
      const newCustomFields = { ...prev.customFields };
      delete newCustomFields[key];
      return {
        ...prev,
        customFields: newCustomFields,
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Person</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={personData.name}
                onChange={(e) => setPersonData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={personData.email}
                onChange={(e) => setPersonData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={personData.phone}
              onChange={(e) => setPersonData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
              required
            />
          </div>

          {/* Custom Fields */}
          <div className="space-y-3">
            <Label>Custom Fields</Label>
            
            {Object.entries(personData.customFields).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="font-medium">{key}:</span>
                <span className="flex-1">{value}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCustomField(key)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <div className="flex gap-2">
              <Input
                placeholder="Field name"
                value={customFieldKey}
                onChange={(e) => setCustomFieldKey(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Field value"
                value={customFieldValue}
                onChange={(e) => setCustomFieldValue(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomField}
                disabled={!customFieldKey.trim() || !customFieldValue.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
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
              disabled={updatePersonMutation.isPending}
            >
              {updatePersonMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Update Person
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
