import { filterPersons, evaluateCondition, matchesFilter } from './filter.util';
import { Person } from '@app/database';
import { FilterGroup, Condition } from '../dto/filter.types';

describe('Filter Utility', () => {
  const mockPersons: Person[] = [
    {
      id: '1',
      email: 'john@example.com',
      name: 'John Doe',
      phone: '1234567890',
      customFields: {
        age: '25',
        department: 'Engineering',
        salary: '50000',
        hireDate: '2023-01-15',
        isActive: 'true',
        location: 'New York',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      populations: [],
    } as Person,
    {
      id: '2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      phone: '0987654321',
      customFields: {
        age: '30',
        department: 'Marketing',
        salary: '60000',
        hireDate: '2022-06-20',
        isActive: 'false',
        location: 'Los Angeles',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      populations: [],
    } as Person,
    {
      id: '3',
      email: 'bob@example.com',
      name: 'Bob Johnson',
      phone: '5555555555',
      customFields: {
        age: '35',
        department: 'Engineering',
        salary: '70000',
        hireDate: '2021-12-10',
        isActive: 'true',
        location: 'Chicago',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      populations: [],
    } as Person,
  ];

  describe('evaluateCondition', () => {
    describe('number type', () => {
      it('should evaluate equals operator correctly', () => {
        expect(evaluateCondition('25', '=', '25', 'number')).toBe(true);
        expect(evaluateCondition('25', '=', '30', 'number')).toBe(false);
      });

      it('should evaluate not equals operator correctly', () => {
        expect(evaluateCondition('25', '!=', '30', 'number')).toBe(true);
        expect(evaluateCondition('25', '!=', '25', 'number')).toBe(false);
      });

      it('should evaluate greater than operator correctly', () => {
        expect(evaluateCondition('30', '>', '25', 'number')).toBe(true);
        expect(evaluateCondition('25', '>', '30', 'number')).toBe(false);
        expect(evaluateCondition('25', '>', '25', 'number')).toBe(false);
      });

      it('should evaluate less than operator correctly', () => {
        expect(evaluateCondition('25', '<', '30', 'number')).toBe(true);
        expect(evaluateCondition('30', '<', '25', 'number')).toBe(false);
        expect(evaluateCondition('25', '<', '25', 'number')).toBe(false);
      });

      it('should evaluate greater than or equal operator correctly', () => {
        expect(evaluateCondition('30', '>=', '25', 'number')).toBe(true);
        expect(evaluateCondition('25', '>=', '25', 'number')).toBe(true);
        expect(evaluateCondition('20', '>=', '25', 'number')).toBe(false);
      });

      it('should evaluate less than or equal operator correctly', () => {
        expect(evaluateCondition('25', '<=', '30', 'number')).toBe(true);
        expect(evaluateCondition('25', '<=', '25', 'number')).toBe(true);
        expect(evaluateCondition('30', '<=', '25', 'number')).toBe(false);
      });

      it('should handle string numbers correctly', () => {
        expect(evaluateCondition('25', '=', 25, 'number')).toBe(true);
        expect(evaluateCondition(25, '=', '25', 'number')).toBe(true);
      });

      it('should handle whitespace in numbers', () => {
        expect(evaluateCondition(' 25 ', '=', '25', 'number')).toBe(true);
        expect(evaluateCondition('25', '=', ' 25 ', 'number')).toBe(true);
      });
    });

    describe('string type', () => {
      it('should evaluate equals operator correctly', () => {
        expect(evaluateCondition('Engineering', '=', 'Engineering', 'string')).toBe(true);
        expect(evaluateCondition('Engineering', '=', 'Marketing', 'string')).toBe(false);
      });

      it('should evaluate not equals operator correctly', () => {
        expect(evaluateCondition('Engineering', '!=', 'Marketing', 'string')).toBe(true);
        expect(evaluateCondition('Engineering', '!=', 'Engineering', 'string')).toBe(false);
      });

      it('should handle case sensitivity', () => {
        expect(evaluateCondition('Engineering', '=', 'engineering', 'string')).toBe(false);
        expect(evaluateCondition('Engineering', '!=', 'engineering', 'string')).toBe(true);
      });

      it('should handle different data types', () => {
        expect(evaluateCondition('25', '=', 25, 'string')).toBe(true);
        expect(evaluateCondition(25, '=', '25', 'string')).toBe(true);
      });
    });

    describe('date type', () => {
      it('should evaluate equals operator correctly', () => {
        const date1 = '2023-01-15';
        const date2 = '2023-01-15';
        const date3 = '2023-01-16';

        expect(evaluateCondition(date1, '=', date2, 'date')).toBe(true);
        expect(evaluateCondition(date1, '=', date3, 'date')).toBe(false);
      });

      it('should evaluate not equals operator correctly', () => {
        const date1 = '2023-01-15';
        const date2 = '2023-01-16';

        expect(evaluateCondition(date1, '!=', date2, 'date')).toBe(true);
        expect(evaluateCondition(date1, '!=', date1, 'date')).toBe(false);
      });

      it('should evaluate greater than operator correctly', () => {
        const date1 = '2023-01-16';
        const date2 = '2023-01-15';

        expect(evaluateCondition(date1, '>', date2, 'date')).toBe(true);
        expect(evaluateCondition(date2, '>', date1, 'date')).toBe(false);
        expect(evaluateCondition(date1, '>', date1, 'date')).toBe(false);
      });

      it('should evaluate less than operator correctly', () => {
        const date1 = '2023-01-15';
        const date2 = '2023-01-16';

        expect(evaluateCondition(date1, '<', date2, 'date')).toBe(true);
        expect(evaluateCondition(date2, '<', date1, 'date')).toBe(false);
        expect(evaluateCondition(date1, '<', date1, 'date')).toBe(false);
      });

      it('should evaluate greater than or equal operator correctly', () => {
        const date1 = '2023-01-16';
        const date2 = '2023-01-15';

        expect(evaluateCondition(date1, '>=', date2, 'date')).toBe(true);
        expect(evaluateCondition(date1, '>=', date1, 'date')).toBe(true);
        expect(evaluateCondition(date2, '>=', date1, 'date')).toBe(false);
      });

      it('should evaluate less than or equal operator correctly', () => {
        const date1 = '2023-01-15';
        const date2 = '2023-01-16';

        expect(evaluateCondition(date1, '<=', date2, 'date')).toBe(true);
        expect(evaluateCondition(date1, '<=', date1, 'date')).toBe(true);
        expect(evaluateCondition(date2, '<=', date1, 'date')).toBe(false);
      });

      it('should handle different date formats', () => {
        const date1 = '2023-01-15T00:00:00.000Z';
        const date2 = '2023-01-15';

        expect(evaluateCondition(date1, '=', date2, 'date')).toBe(true);
      });
    });

    describe('boolean type', () => {
      it('should return false for boolean type (not implemented)', () => {
        expect(evaluateCondition('true', '=', 'true', 'boolean')).toBe(false);
        expect(evaluateCondition('false', '=', 'false', 'boolean')).toBe(false);
      });
    });

    describe('invalid operator', () => {
      it('should return false for invalid operator', () => {
        expect(evaluateCondition('25', 'invalid' as any, '25', 'number')).toBe(false);
      });
    });
  });

  describe('matchesFilter', () => {
    it('should match simple condition', () => {
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Engineering',
          } as Condition,
        ],
      };

      const result = matchesFilter(mockPersons[0], filter);
      expect(result).toBe(true);
    });

    it('should not match when condition fails', () => {
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Marketing',
          } as Condition,
        ],
      };

      const result = matchesFilter(mockPersons[0], filter);
      expect(result).toBe(false);
    });

    it('should handle AND logic correctly', () => {
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Engineering',
          } as Condition,
          {
            field: 'age',
            operator: '>',
            type: 'number',
            value: '20',
          } as Condition,
        ],
      };

      const result = matchesFilter(mockPersons[0], filter);
      expect(result).toBe(true);
    });

    it('should handle OR logic correctly', () => {
      const filter: FilterGroup = {
        logic: 'OR',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Marketing',
          } as Condition,
          {
            field: 'age',
            operator: '>',
            type: 'number',
            value: '20',
          } as Condition,
        ],
      };

      const result = matchesFilter(mockPersons[0], filter);
      expect(result).toBe(true);
    });

    it('should handle nested filter groups', () => {
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Engineering',
          } as Condition,
          {
            logic: 'OR',
            conditions: [
              {
                field: 'age',
                operator: '>',
                type: 'number',
                value: '30',
              } as Condition,
              {
                field: 'location',
                operator: '=',
                type: 'string',
                value: 'New York',
              } as Condition,
            ],
          } as FilterGroup,
        ],
      };

      const result = matchesFilter(mockPersons[0], filter);
      expect(result).toBe(true);
    });

    it('should handle missing customFields', () => {
      const personWithoutCustomFields = { ...mockPersons[0], customFields: undefined };
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Engineering',
          } as Condition,
        ],
      };

      const result = matchesFilter(personWithoutCustomFields, filter);
      expect(result).toBe(false);
    });

    it('should handle missing field in customFields', () => {
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'nonexistent',
            operator: '=',
            type: 'string',
            value: 'value',
          } as Condition,
        ],
      };

      const result = matchesFilter(mockPersons[0], filter);
      expect(result).toBe(false);
    });
  });

  describe('filterPersons', () => {
    it('should filter persons based on simple condition', () => {
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Engineering',
          } as Condition,
        ],
      };

      const result = filterPersons(mockPersons, filter);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('should filter persons based on multiple conditions with AND logic', () => {
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Engineering',
          } as Condition,
          {
            field: 'age',
            operator: '>',
            type: 'number',
            value: '25',
          } as Condition,
        ],
      };

      const result = filterPersons(mockPersons, filter);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('should filter persons based on multiple conditions with OR logic', () => {
      const filter: FilterGroup = {
        logic: 'OR',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Marketing',
          } as Condition,
          {
            field: 'age',
            operator: '>',
            type: 'number',
            value: '30',
          } as Condition,
        ],
      };

      const result = filterPersons(mockPersons, filter);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
    });

    it('should return empty array when no persons match', () => {
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Nonexistent',
          } as Condition,
        ],
      };

      const result = filterPersons(mockPersons, filter);
      expect(result).toHaveLength(0);
    });

    it('should handle complex nested filters', () => {
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'department',
            operator: '=',
            type: 'string',
            value: 'Engineering',
          } as Condition,
          {
            logic: 'OR',
            conditions: [
              {
                field: 'age',
                operator: '>',
                type: 'number',
                value: '30',
              } as Condition,
              {
                field: 'location',
                operator: '=',
                type: 'string',
                value: 'New York',
              } as Condition,
            ],
          } as FilterGroup,
        ],
      };

      const result = filterPersons(mockPersons, filter);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('should handle date filtering', () => {
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'hireDate',
            operator: '>',
            type: 'date',
            value: '2022-01-01',
          } as Condition,
        ],
      };

      const result = filterPersons(mockPersons, filter);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should handle number comparison with string values', () => {
      const filter: FilterGroup = {
        logic: 'AND',
        conditions: [
          {
            field: 'salary',
            operator: '>',
            type: 'number',
            value: '55000',
          } as Condition,
        ],
      };

      const result = filterPersons(mockPersons, filter);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
    });
  });
});