/**
 * useFormLogic Hook
 * 
 * React hook for integrating form logic rules with form state.
 * Automatically executes logic rules when form values change.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FormField } from './types';
import {
    LogicRule,
    FormValues,
    FieldStates,
    executeLogicRules,
    initializeFieldStates,
    getFieldDependencies,
    validateLogicRules,
    debugLogicExecution,
} from './LogicEngine';

export interface UseFormLogicOptions {
    fields: FormField[];
    rules: LogicRule[];
    initialValues?: FormValues;
    debug?: boolean;
    onFieldStateChange?: (fieldStates: FieldStates) => void;
}

export interface UseFormLogicReturn {
    formValues: FormValues;
    fieldStates: FieldStates;
    setFieldValue: (fieldId: string, value: any) => void;
    setFormValues: (values: FormValues) => void;
    resetForm: () => void;
    isFieldVisible: (fieldId: string) => boolean;
    isFieldRequired: (fieldId: string) => boolean;
    isFieldDisabled: (fieldId: string) => boolean;
    getFieldValue: (fieldId: string) => any;
    getDependencies: (fieldId: string) => string[];
    validation: { valid: boolean; errors: string[] };
    reExecuteLogic: () => void;
}

export function useFormLogic({
    fields,
    rules,
    initialValues = {},
    debug = false,
    onFieldStateChange,
}: UseFormLogicOptions): UseFormLogicReturn {
    // Initialize form values
    const [formValues, setFormValuesState] = useState<FormValues>(() => {
        const values: FormValues = {};
        fields.forEach(field => {
            values[field.id] = initialValues[field.id] ?? field.default_value ?? '';
        });
        return values;
    });

    // Initialize field states
    const [fieldStates, setFieldStates] = useState<FieldStates>(() =>
        initializeFieldStates(fields)
    );

    // Validate logic rules
    const validation = useMemo(() =>
        validateLogicRules(rules, fields),
        [rules, fields]
    );

    // Execute logic rules whenever form values or rules change
    const executeLogic = useCallback(() => {
        if (debug) {
            debugLogicExecution(rules, formValues, fields);
        }

        const newFieldStates = executeLogicRules(rules, formValues, fields, fieldStates);
        setFieldStates(newFieldStates);

        if (onFieldStateChange) {
            onFieldStateChange(newFieldStates);
        }
    }, [rules, formValues, fields, fieldStates, debug, onFieldStateChange]);

    // Execute logic on mount and when dependencies change
    useEffect(() => {
        executeLogic();
    }, [formValues, rules]);

    // Set a single field value
    const setFieldValue = useCallback((fieldId: string, value: any) => {
        setFormValuesState(prev => ({
            ...prev,
            [fieldId]: value,
        }));
    }, []);

    // Set multiple field values at once
    const setFormValues = useCallback((values: FormValues) => {
        setFormValuesState(prev => ({
            ...prev,
            ...values,
        }));
    }, []);

    // Reset form to initial state
    const resetForm = useCallback(() => {
        const values: FormValues = {};
        fields.forEach(field => {
            values[field.id] = initialValues[field.id] ?? field.default_value ?? '';
        });
        setFormValuesState(values);
        setFieldStates(initializeFieldStates(fields));
    }, [fields, initialValues]);

    // Helper functions
    const isFieldVisible = useCallback((fieldId: string) => {
        return fieldStates[fieldId]?.visible ?? true;
    }, [fieldStates]);

    const isFieldRequired = useCallback((fieldId: string) => {
        return fieldStates[fieldId]?.required ?? false;
    }, [fieldStates]);

    const isFieldDisabled = useCallback((fieldId: string) => {
        return fieldStates[fieldId]?.disabled ?? false;
    }, [fieldStates]);

    const getFieldValue = useCallback((fieldId: string) => {
        return formValues[fieldId];
    }, [formValues]);

    const getDependencies = useCallback((fieldId: string) => {
        return getFieldDependencies(fieldId, rules);
    }, [rules]);

    return {
        formValues,
        fieldStates,
        setFieldValue,
        setFormValues,
        resetForm,
        isFieldVisible,
        isFieldRequired,
        isFieldDisabled,
        getFieldValue,
        getDependencies,
        validation,
        reExecuteLogic: executeLogic,
    };
}

export default useFormLogic;
