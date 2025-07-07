import { Person } from "@app/database";
import { Condition, FilterGroup } from "../dto/filter.types";

export function filterPersons(persons: Person[], filter: FilterGroup): Person[] {
    return persons.filter(p => matchesFilter(p, filter));
}

export function evaluateCondition(fieldValue: any, operator: Condition['operator'], value: any, type: "string" | "number" | "date" | "boolean"): boolean {
    switch (type) {
        case 'number':
            const numA = Number(String(fieldValue).trim());
            const numB = Number(String(value).trim());
            switch (operator) {
                case '=': return numA === numB;
                case '!=': return numA !== numB;
                case '>': return numA > numB;
                case '<': return numA < numB;
                case '>=': return numA >= numB;
                case '<=': return numA <= numB;
                default: return false;
            }
        case 'string':
            switch (operator) {
                case '=': return String(fieldValue) == String(value);
                case '!=': return String(fieldValue) != String(value);
                default: return false;
            }
        case 'date':
            const dateA = new Date(fieldValue);
            const dateB = new Date(value);
            switch (operator) {
                case '=': return dateA.getTime() == dateB.getTime();
                case '!=': return dateA.getTime() != dateB.getTime();
                case '>': return dateA.getTime() > dateB.getTime();
                case '<': return dateA.getTime() < dateB.getTime();
                case '>=': return dateA.getTime() >= dateB.getTime();
                case '<=': return dateA.getTime() <= dateB.getTime();
                default: return false;
            }
        default:
            return false;
    }
}

export function matchesFilter(person: any, filter: FilterGroup): boolean {
    const results = filter.conditions.map(cond => {
        if ('field' in cond) {
            const val = person.customFields?.[cond.field];
            return evaluateCondition(val, cond.operator, cond.value, cond.type);
        } else {
            return matchesFilter(person, cond);
        }
    });

    return filter.logic === 'AND'
        ? results.every(Boolean)
        : results.some(Boolean);
}