
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import type { Person } from '@/types';

interface PeopleGridProps {
  people: Person[];
  total: number;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
}

export const PeopleGrid: React.FC<PeopleGridProps> = ({ 
  people, 
  total, 
  onEdit, 
  onDelete 
}) => {
  // Get all unique custom field keys
  const allCustomFields = new Set<string>();
  people.forEach(person => {
    if (person.customFields) {
      Object.keys(person.customFields).forEach(key => allCustomFields.add(key));
    }
  });
  const customFieldKeys = Array.from(allCustomFields).sort();

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object' && value instanceof Date) {
      return new Date(value).toLocaleDateString();
    }
    return String(value);
  };

  if (people.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No people found</h3>
          <p className="text-gray-600">This population doesn't have any people yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          People Data ({total} total)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="min-w-[200px]">Name</TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead className="min-w-[150px]">Phone</TableHead>
                {customFieldKeys.map(field => (
                  <TableHead key={field} className="min-w-[120px] capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </TableHead>
                ))}
                <TableHead className="min-w-[120px]">Added On</TableHead>
                {(onEdit || onDelete) && (
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {person.name || '-'}
                  </TableCell>
                  <TableCell>{person.email}</TableCell>
                  <TableCell>{person.phone || '-'}</TableCell>
                  {customFieldKeys.map(field => (
                    <TableCell key={field}>
                      {person.customFields?.[field] !== undefined ? (
                        <Badge variant="outline" className="text-xs">
                          {formatValue(person.customFields[field])}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-sm text-gray-500">
                    {new Date(person.createdAt).toLocaleDateString()}
                  </TableCell>
                  {(onEdit || onDelete) && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(person)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => onDelete(person)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
