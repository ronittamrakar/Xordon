import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, ChevronLeft, Check, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldRenderer } from '@/components/webforms/form-builder/FieldRenderer';

interface FormField {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
    step?: number;
}

interface FormData {
    title: string;
    description?: string;
    type: 'single_step' | 'multi_step' | 'popup';
    settings?: {
        design?: {
            theme?: string;
            primaryColor?: string;
            buttonStyle?: string;
        };
        behavior?: {
            showProgressBar?: boolean;
            allowSaveProgress?: boolean;
            requireAllFields?: boolean;
        };
    };
    fields: FormField[];
}

interface FormRendererProps {
    formData: FormData;
    onSubmit?: (data: Record<string, any>) => void;
    previewMode?: boolean;
    viewAllSteps?: boolean;
    previewStyle?: 'pagination' | 'accordion' | 'all';
}

export const FormRenderer: React.FC<FormRendererProps> = ({
    formData,
    onSubmit,
    previewMode = false,
    viewAllSteps = false,
    previewStyle = 'pagination'
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [expandedSteps, setExpandedSteps] = useState<number[]>([1]);
    const [formValues, setFormValues] = useState<Record<string, any>>({});

    const activeStyle = viewAllSteps ? 'all' : previewStyle;

    const isMultiStep = formData.type === 'multi_step';
    const primaryColor = formData.settings?.design?.primaryColor || '#3B82F6';
    const showProgressBar = formData.settings?.behavior?.showProgressBar !== false;

    // Group fields by step
    const fieldsByStep = formData.fields.reduce((acc, field) => {
        const step = field.step || 1;
        if (!acc[step]) acc[step] = [];
        acc[step].push(field);
        return acc;
    }, {} as Record<number, FormField[]>);

    const totalSteps = Math.max(1, ...Object.keys(fieldsByStep).map(Number));
    const currentFields = fieldsByStep[currentStep] || [];
    const progress = (currentStep / totalSteps) * 100;

    const handleFieldChange = (fieldId: string, value: any) => {
        setFormValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const toggleStep = (step: number) => {
        setExpandedSteps(prev =>
            prev.includes(step)
                ? prev.filter(s => s !== step)
                : [...prev, step]
        );
    };

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit && !previewMode) {
            onSubmit(formValues);
        }
    };

    const renderField = (field: FormField) => {
        return (
            <FieldRenderer
                key={field.id}
                field={field as any}
                value={formValues[field.id]}
                onChange={(val) => handleFieldChange(field.id, val)}
                allValues={formValues}
                onFieldChange={handleFieldChange}
                designSettings={formData.settings?.design || {}}
                showLabel={true}
                showDescription={true}
            />
        );
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">{formData.title}</CardTitle>
                {formData.description && (
                    <CardDescription className="text-base">{formData.description}</CardDescription>
                )}
                {isMultiStep && showProgressBar && activeStyle === 'pagination' && (
                    <div className="pt-4 space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Step {currentStep} of {totalSteps}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" style={{
                            // @ts-ignore
                            '--progress-background': primaryColor
                        }} />
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                    {activeStyle === 'all' && isMultiStep ? (
                        <div className="space-y-8">
                            {Object.keys(fieldsByStep).sort((a, b) => Number(a) - Number(b)).map((step) => (
                                <div key={step} className="border rounded-lg p-5 relative">
                                    <div className="absolute -top-3 left-4">
                                        <Badge variant="secondary" className="text-sm border bg-background px-3">
                                            Step {step}
                                        </Badge>
                                    </div>
                                    <div className="space-y-4 pt-2">
                                        {(fieldsByStep[Number(step)] || []).map(renderField)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeStyle === 'accordion' && isMultiStep ? (
                        <div className="space-y-4">
                            {Object.keys(fieldsByStep).sort((a, b) => Number(a) - Number(b)).map((step) => {
                                const stepNum = Number(step);
                                const isExpanded = expandedSteps.includes(stepNum);
                                return (
                                    <div key={step} className="border rounded-lg overflow-hidden transition-all duration-300">
                                        <button
                                            type="button"
                                            onClick={() => toggleStep(stepNum)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 text-left font-medium transition-colors",
                                                isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Badge variant={isExpanded ? "default" : "outline"} className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                                                    {stepNum}
                                                </Badge>
                                                <span>Step {stepNum} Details</span>
                                            </div>
                                            <ChevronRight className={cn("h-5 w-5 transition-transform duration-200", isExpanded && "rotate-90")} />
                                        </button>
                                        <div className={cn(
                                            "transition-all duration-300 ease-in-out",
                                            isExpanded ? "max-h-[1000px] opacity-100 p-5" : "max-h-0 opacity-0 overflow-hidden"
                                        )}>
                                            <div className="space-y-4">
                                                {(fieldsByStep[stepNum] || []).map(renderField)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <>
                            {isMultiStep && activeStyle === 'pagination' && (
                                <div className="mb-4">
                                    <Badge variant="outline" className="text-sm">
                                        Step {currentStep}
                                    </Badge>
                                </div>
                            )}

                            <div className="space-y-4">
                                {activeStyle === 'pagination' ? currentFields.map(renderField) : formData.fields.map(renderField)}
                            </div>
                        </>
                    )}

                    {activeStyle === 'pagination' && isMultiStep ? (
                        <div className="flex justify-between pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePrevious}
                                disabled={currentStep === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Button>
                            {currentStep < totalSteps ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={previewMode}
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Submit
                                </Button>
                            )}
                        </div>
                    ) : (
                        (activeStyle === 'all' || activeStyle === 'accordion' || !isMultiStep) && (
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={previewMode}
                                style={{ backgroundColor: primaryColor }}
                            >
                                {isMultiStep && activeStyle !== 'pagination' ? <><Check className="h-4 w-4 mr-2" /> Submit</> : 'Submit'}
                            </Button>
                        )
                    )}

                    {previewMode && (
                        <p className="text-xs text-center text-muted-foreground pt-2">
                            This is a preview. Form submission is disabled.
                        </p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
};
