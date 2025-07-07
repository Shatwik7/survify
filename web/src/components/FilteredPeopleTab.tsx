
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { populationService } from '@/services/api';
import { PeopleGrid } from './PeopleGrid';
import { Filter, Search, Plus, Trash2 } from 'lucide-react';
import type { Person } from '@/types';

interface FilteredPeopleTabProps {
  populationId: string;
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

export const FilteredPeopleTab: React.FC<FilteredPeopleTabProps> = ({ populationId }) => {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    logic: 'AND',
    conditions: [
      { field: '', operator: '=', type: 'string', value: '' }
    ]
  });
  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data: filteredPeople, isLoading, refetch } = useQuery({
    queryKey: ['filteredPeople', populationId, filterGroup],
    queryFn: async () => {
      const validConditions = filterGroup.conditions.filter(c => 
        'field' in c && c.field && c.value !== ''
      );
      if (validConditions.length === 0) return [];
      
      // Convert string values back to proper types for API
      const processedConditions = validConditions.map(condition => {
        if ('field' in condition) {
          let processedValue = condition.value;
          
          // Convert value based on type
          if (condition.type === 'number' && typeof condition.value === 'string') {
            processedValue = parseFloat(condition.value);
          } else if (condition.type === 'boolean' && typeof condition.value === 'string') {
            processedValue = condition.value.toLowerCase() === 'true';
          }
          
          return {
            ...condition,
            value: processedValue
          };
        }
        return condition;
      });
      
      const validFilterGroup = {
        ...filterGroup,
        conditions: processedConditions
      };
      
      return populationService.filterPopulation(populationId, validFilterGroup);
    },
    enabled: searchTriggered && filterGroup.conditions.some(c => 'field' in c && c.field && c.value !== ''),
  });

  const addCondition = () => {
    setFilterGroup(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: '=', type: 'string', value: '' }]
    }));
  };

  const removeCondition = (index: number) => {
    setFilterGroup(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, field: keyof Condition, value: any) => {
    setFilterGroup(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index && 'field' in condition ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const handleSearch = () => {
    setSearchTriggered(true);
    refetch();
  };

  const hasValidConditions = filterGroup.conditions.some(c => 'field' in c && c.field && c.value !== '');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter People
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">Logic:</span>
            <Select
              value={filterGroup.logic}
              onValueChange={(value: 'AND' | 'OR') => 
                setFilterGroup(prev => ({ ...prev, logic: value }))
              }
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

          {filterGroup.conditions.map((condition, index) => {
            if (!('field' in condition)) return null;
            
            return (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                <Input
                  placeholder="Field name (e.g., name, email)"
                  value={condition.field}
                  onChange={(e) => updateCondition(index, 'field', e.target.value)}
                  className="flex-1 bg-white"
                />
                
                <Select
                  value={condition.operator}
                  onValueChange={(value: any) => updateCondition(index, 'operator', value)}
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

                <Select
                  value={condition.type}
                  onValueChange={(value: any) => updateCondition(index, 'type', value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Value"
                  value={String(condition.value)}
                  onChange={(e) => {
                    updateCondition(index, 'value', e.target.value);
                  }}
                  className="flex-1 bg-white"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(index)}
                  disabled={filterGroup.conditions.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={addCondition}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
            <Button
              onClick={handleSearch}
              disabled={!hasValidConditions}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchTriggered && (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPeople && filteredPeople.length > 0 ? (
            <PeopleGrid 
              people={filteredPeople} 
              total={filteredPeople.length}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try adjusting your filters to find more people.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
