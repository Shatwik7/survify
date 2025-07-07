
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { populationService } from '@/services/api';
import { Plus, Trash2, Filter, Loader2, Parentheses } from 'lucide-react';

interface SegmentationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  populationId: string | null;
}

interface Condition {
  field: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=';
  type: 'string' | 'number' | 'boolean' | 'date';
  value: any;
}

interface FilterGroup {
  logic: 'AND' | 'OR';
  conditions: (Condition | FilterGroup)[];
}

export const SegmentationModal: React.FC<SegmentationModalProps> = ({
  open,
  onOpenChange,
  populationId,
}) => {
  const [segmentName, setSegmentName] = useState('');
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    logic: 'AND',
    conditions: [{ field: '', operator: '=', type: 'string', value: '' }],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSegmentMutation = useMutation({
    mutationFn: (data: { parentPopulationId: string; segmentName: string; filter: FilterGroup }) =>
      populationService.createSegment(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Segment creation started successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['populations'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create segment",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSegmentName('');
    setFilterGroup({
      logic: 'AND',
      conditions: [{ field: '', operator: '=', type: 'string', value: '' }],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!populationId || !segmentName.trim()) return;

    const validFilter = cleanupFilter(filterGroup);
    if (!hasValidConditions(validFilter)) {
      toast({
        title: "Error",
        description: "Please add at least one valid condition",
        variant: "destructive",
      });
      return;
    }

    createSegmentMutation.mutate({
      parentPopulationId: populationId,
      segmentName: segmentName.trim(),
      filter: validFilter,
    });
  };

  const cleanupFilter = (filter: FilterGroup): FilterGroup => {
    const validConditions = filter.conditions.filter(condition => {
      if ('field' in condition) {
        return condition.field && condition.value !== '';
      }
      return hasValidConditions(condition);
    }).map(condition => {
      if ('field' in condition) {
        return condition;
      }
      return cleanupFilter(condition);
    });

    return { ...filter, conditions: validConditions };
  };

  const hasValidConditions = (filter: FilterGroup): boolean => {
    return filter.conditions.some(condition => {
      if ('field' in condition) {
        return condition.field && condition.value !== '';
      }
      return hasValidConditions(condition);
    });
  };

  const addCondition = (targetGroup: FilterGroup, path: number[] = []) => {
    const newCondition: Condition = { field: '', operator: '=', type: 'string', value: '' };
    updateFilterGroup(targetGroup, path, (group) => ({
      ...group,
      conditions: [...group.conditions, newCondition],
    }));
  };

  const addNestedGroup = (targetGroup: FilterGroup, path: number[] = []) => {
    const newGroup: FilterGroup = {
      logic: 'AND',
      conditions: [{ field: '', operator: '=', type: 'string', value: '' }],
    };
    updateFilterGroup(targetGroup, path, (group) => ({
      ...group,
      conditions: [...group.conditions, newGroup],
    }));
  };

  const removeCondition = (targetGroup: FilterGroup, index: number, path: number[] = []) => {
    updateFilterGroup(targetGroup, path, (group) => ({
      ...group,
      conditions: group.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (targetGroup: FilterGroup, index: number, field: keyof Condition, value: any, path: number[] = []) => {
    updateFilterGroup(targetGroup, path, (group) => ({
      ...group,
      conditions: group.conditions.map((condition, i) => {
        if (i === index && 'field' in condition) {
          const updatedCondition = { ...condition, [field]: value };
          // Auto-detect type based on value
          if (field === 'value' && typeof value === 'string') {
            if (!isNaN(Number(value)) && value !== '') {
              updatedCondition.type = 'number';
              updatedCondition.value = Number(value);
            } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
              updatedCondition.type = 'boolean';
              updatedCondition.value = value.toLowerCase() === 'true';
            } else if (Date.parse(value)) {
              updatedCondition.type = 'date';
            } else {
              updatedCondition.type = 'string';
            }
          }
          return updatedCondition;
        }
        return condition;
      }),
    }));
  };

  const updateFilterGroup = (currentGroup: FilterGroup, path: number[], updater: (group: FilterGroup) => FilterGroup) => {
    if (path.length === 0) {
      setFilterGroup(updater(currentGroup));
      return;
    }

    const [currentIndex, ...remainingPath] = path;
    const targetCondition = currentGroup.conditions[currentIndex];
    
    if ('logic' in targetCondition) {
      updateFilterGroup(targetCondition, remainingPath, updater);
    }
  };

  const renderFilterGroup = (group: FilterGroup, path: number[] = [], depth: number = 0): React.ReactNode => {
    return (
      <Card key={path.join('-')} className={`${depth > 0 ? 'ml-4 border-l-4 border-l-blue-300' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {depth > 0 && <Parentheses className="h-4 w-4" />}
              Group Logic
            </CardTitle>
            <Select
              value={group.logic}
              onValueChange={(value: 'AND' | 'OR') => {
                updateFilterGroup(filterGroup, path, (g) => ({ ...g, logic: value }));
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {group.conditions.map((condition, index) => {
            const currentPath = [...path, index];
            
            if ('field' in condition) {
              return (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                  <Input
                    placeholder="Field name (e.g., age, city)"
                    value={condition.field}
                    onChange={(e) => updateCondition(filterGroup, index, 'field', e.target.value, path)}
                    className="flex-1 bg-white"
                  />
                  
                  <Select
                    value={condition.operator}
                    onValueChange={(value: any) => updateCondition(filterGroup, index, 'operator', value, path)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="=">=</SelectItem>
                      <SelectItem value="!=">!=</SelectItem>
                      <SelectItem value=">">&gt;</SelectItem>
                      <SelectItem value=">=">&gt;=</SelectItem>
                      <SelectItem value="<">&lt;</SelectItem>
                      <SelectItem value="<=">&lt;=</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Value"
                    value={condition.value}
                    onChange={(e) => updateCondition(filterGroup, index, 'value', e.target.value, path)}
                    className="flex-1 bg-white"
                  />

                  <div className="text-xs text-gray-500 min-w-16 px-2 py-1 bg-white border rounded">
                    {condition.type}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(filterGroup, index, path)}
                    disabled={group.conditions.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            } else {
              return (
                <div key={index}>
                  {renderFilterGroup(condition, currentPath, depth + 1)}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(filterGroup, index, path)}
                    className="mt-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove Group
                  </Button>
                </div>
              );
            }
          })}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addCondition(filterGroup, path)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Condition
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addNestedGroup(filterGroup, path)}
            >
              <Parentheses className="h-4 w-4 mr-1" />
              Add Group
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Create Population Segment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="segmentName">Segment Name</Label>
            <Input
              id="segmentName"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="Enter segment name"
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Filter Conditions</h3>
            {renderFilterGroup(filterGroup)}
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
              disabled={createSegmentMutation.isPending}
            >
              {createSegmentMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Segment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
