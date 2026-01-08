/**
 * Logic Execution Engine
 * 
 * This module provides runtime execution of form logic rules.
 * It evaluates conditions and applies actions to form fields in real-time.
 */

import { FormField } from './types';

export interface LogicRule {
    id: string;
    name: string;
    enabled: boolean;
    conditionLogic: 'all' | 'any';
    conditions: LogicCondition[];
    actions: LogicAction[];
    elseActions?: LogicAction[];
    elseEnabled?: boolean;
    priority?: number;
}

export interface LogicCondition {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' |
    'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' |
    'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal';
    value: string;
    compareWithField?: boolean;
    caseInsensitive?: boolean;
}

export interface LogicAction {
    type: 'show_fields' | 'hide_fields' | 'require_fields' | 'unrequire_fields' |
    'set_value' | 'skip_to_page' | 'redirect' | 'calculate';
    targets?: string[];
    target?: string;
    value?: any;
    config?: Record<string, any>;
}

export interface FieldState {
    visible: boolean;
    required: boolean;
    disabled: boolean;
    value?: any;
}

export type FormValues = Record<string, any>;
export type FieldStates = Record<string, FieldState>;

/**
 * Evaluate a single condition against form values
 */
function evaluateCondition(
    condition: LogicCondition,
    formValues: FormValues,
    fields: FormField[]
): boolean {
    const fieldValue = formValues[condition.fieldId];
    let compareValue = condition.value;

    // If comparing with another field, get that field's value
    if (condition.compareWithField) {
        compareValue = formValues[condition.value];
    }

    // Convert to strings for comparison if needed
    let fieldStr = String(fieldValue ?? '');
    let compareStr = String(compareValue ?? '');

    // Apply case insensitivity
    if (condition.caseInsensitive) {
        fieldStr = fieldStr.toLowerCase();
        compareStr = compareStr.toLowerCase();
    }

    // Evaluate based on operator
    switch (condition.operator) {
        case 'equals':
            return fieldStr === compareStr;

        case 'not_equals':
            return fieldStr !== compareStr;

        case 'contains':
            return fieldStr.includes(compareStr);

        case 'not_contains':
            return !fieldStr.includes(compareStr);

        case 'starts_with':
            return fieldStr.startsWith(compareStr);

        case 'ends_with':
            return fieldStr.endsWith(compareStr);

        case 'is_empty':
            return !fieldValue || fieldStr.trim() === '';

        case 'is_not_empty':
            return !!fieldValue && fieldStr.trim() !== '';

        case 'greater_than':
            return Number(fieldValue) > Number(compareValue);

        case 'less_than':
            return Number(fieldValue) < Number(compareValue);

        case 'greater_or_equal':
            return Number(fieldValue) >= Number(compareValue);

        case 'less_or_equal':
            return Number(fieldValue) <= Number(compareValue);

        default:
            console.warn(`Unknown operator: ${condition.operator}`);
            return false;
    }
}

/**
 * Evaluate all conditions in a rule
 */
function evaluateRule(
    rule: LogicRule,
    formValues: FormValues,
    fields: FormField[]
): boolean {
    if (!rule.enabled || rule.conditions.length === 0) {
        return false;
    }

    const results = rule.conditions.map(condition =>
        evaluateCondition(condition, formValues, fields)
    );

    // Apply AND/OR logic
    if (rule.conditionLogic === 'all') {
        return results.every(r => r === true);
    } else {
        return results.some(r => r === true);
    }
}

/**
 * Apply an action to field states
 */
function applyAction(
    action: LogicAction,
    fieldStates: FieldStates,
    formValues: FormValues
): void {
    const targets = action.targets || (action.target ? [action.target] : []);

    switch (action.type) {
        case 'show_fields':
            targets.forEach(fieldId => {
                if (fieldStates[fieldId]) {
                    fieldStates[fieldId].visible = true;
                }
            });
            break;

        case 'hide_fields':
            targets.forEach(fieldId => {
                if (fieldStates[fieldId]) {
                    fieldStates[fieldId].visible = false;
                    // Clear value when hiding field
                    if (formValues[fieldId] !== undefined) {
                        formValues[fieldId] = undefined;
                    }
                }
            });
            break;

        case 'require_fields':
            targets.forEach(fieldId => {
                if (fieldStates[fieldId]) {
                    fieldStates[fieldId].required = true;
                }
            });
            break;

        case 'unrequire_fields':
            targets.forEach(fieldId => {
                if (fieldStates[fieldId]) {
                    fieldStates[fieldId].required = false;
                }
            });
            break;

        case 'set_value':
            if (action.target && action.value !== undefined) {
                formValues[action.target] = action.value;
                if (fieldStates[action.target]) {
                    fieldStates[action.target].value = action.value;
                }
            }
            break;

        case 'calculate':
            // TODO: Implement calculation logic
            console.warn('Calculate action not yet implemented');
            break;

        default:
            console.warn(`Unknown action type: ${action.type}`);
    }
}

/**
 * Initialize field states from form fields
 */
export function initializeFieldStates(fields: FormField[]): FieldStates {
    const states: FieldStates = {};

    fields.forEach(field => {
        states[field.id] = {
            visible: !field.hidden,
            required: field.required || false,
            disabled: field.disabled || false,
            value: field.default_value,
        };
    });

    return states;
}

/**
 * Execute all logic rules and return updated field states
 */
export function executeLogicRules(
    rules: LogicRule[],
    formValues: FormValues,
    fields: FormField[],
    initialStates?: FieldStates
): FieldStates {
    // Initialize field states if not provided
    const fieldStates = initialStates || initializeFieldStates(fields);

    // Sort rules by priority (if defined)
    const sortedRules = [...rules].sort((a, b) => {
        const priorityA = a.priority ?? 999;
        const priorityB = b.priority ?? 999;
        return priorityA - priorityB;
    });

    // Execute each rule
    sortedRules.forEach(rule => {
        if (!rule.enabled) return;

        const conditionsMet = evaluateRule(rule, formValues, fields);

        if (conditionsMet) {
            // Apply main actions
            rule.actions.forEach(action => {
                applyAction(action, fieldStates, formValues);
            });
        } else if (rule.elseEnabled && rule.elseActions) {
            // Apply else actions
            rule.elseActions.forEach(action => {
                applyAction(action, fieldStates, formValues);
            });
        }
    });

    return fieldStates;
}

/**
 * Get fields that a specific field depends on (for dependency tracking)
 */
export function getFieldDependencies(
    fieldId: string,
    rules: LogicRule[]
): string[] {
    const dependencies = new Set<string>();

    rules.forEach(rule => {
        // Check if this rule affects the target field
        const affectsField = rule.actions.some(action =>
            action.targets?.includes(fieldId) || action.target === fieldId
        ) || (rule.elseActions?.some(action =>
            action.targets?.includes(fieldId) || action.target === fieldId
        ));

        if (affectsField) {
            // Add all condition fields as dependencies
            rule.conditions.forEach(condition => {
                dependencies.add(condition.fieldId);
                if (condition.compareWithField && condition.value) {
                    dependencies.add(condition.value);
                }
            });
        }
    });

    return Array.from(dependencies);
}

/**
 * Validate logic rules for circular dependencies
 */
export function validateLogicRules(
    rules: LogicRule[],
    fields: FormField[]
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for circular dependencies
    const fieldPositions = new Map<string, number>();
    fields.forEach((field, index) => {
        fieldPositions.set(String(field.id), index);
    });

    rules.forEach(rule => {
        rule.conditions.forEach(condition => {
            const conditionFieldPos = fieldPositions.get(condition.fieldId);

            rule.actions.forEach(action => {
                const targets = action.targets || (action.target ? [action.target] : []);
                targets.forEach(targetId => {
                    const targetFieldPos = fieldPositions.get(targetId);

                    if (conditionFieldPos !== undefined && targetFieldPos !== undefined) {
                        if (targetFieldPos <= conditionFieldPos) {
                            errors.push(
                                `Rule "${rule.name}": Field "${targetId}" cannot depend on a field that appears after it (${condition.fieldId})`
                            );
                        }
                    }
                });
            });
        });
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Debug helper to log rule execution
 */
export function debugLogicExecution(
    rules: LogicRule[],
    formValues: FormValues,
    fields: FormField[]
): void {
    console.group('🔍 Logic Rules Execution Debug');

    rules.forEach(rule => {
        if (!rule.enabled) {
            console.log(`⏸️ Rule "${rule.name}" is disabled`);
            return;
        }

        const conditionsMet = evaluateRule(rule, formValues, fields);
        console.group(`${conditionsMet ? '✅' : '❌'} Rule: ${rule.name}`);

        console.log('Conditions:', rule.conditions);
        console.log('Condition Logic:', rule.conditionLogic);
        console.log('Conditions Met:', conditionsMet);

        if (conditionsMet) {
            console.log('Executing Actions:', rule.actions);
        } else if (rule.elseEnabled && rule.elseActions) {
            console.log('Executing Else Actions:', rule.elseActions);
        }

        console.groupEnd();
    });

    console.groupEnd();
}

export default {
    executeLogicRules,
    initializeFieldStates,
    getFieldDependencies,
    validateLogicRules,
    debugLogicExecution,
};
