import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertCircle, FileTextIcon, ArrowRight } from 'lucide-react';

interface MappedRecipient {
  [key: string]: string;
}

interface CSVColumnMapperProps {
  csvData: string[][];
  onMappingComplete: (mappedData: MappedRecipient[], mapping: ColumnMapping) => void;
  onCancel: () => void;
}

interface ColumnMapping {
  [csvColumn: string]: string; // CSV column name -> system field name
}

interface SystemField {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

const systemFields: SystemField[] = [
  { key: 'email', label: 'Email', required: true, description: 'Recipient email address' },
  { key: 'firstName', label: 'First Name', required: false, description: 'Recipient first name' },
  { key: 'lastName', label: 'Last Name', required: false, description: 'Recipient last name' },
  { key: 'company', label: 'Company', required: false, description: 'Recipient company name' },
  { key: 'position', label: 'Position/Title', required: false, description: 'Job title or position' },
  { key: 'phone', label: 'Phone', required: false, description: 'Phone number' },
  { key: 'website', label: 'Website', required: false, description: 'Company or personal website' },
  { key: 'industry', label: 'Industry', required: false, description: 'Industry or business sector' },
  { key: 'location', label: 'Location', required: false, description: 'City, state, or address' },
  { key: 'country', label: 'Country', required: false, description: 'Country' },
  { key: 'linkedin', label: 'LinkedIn', required: false, description: 'LinkedIn profile URL' },
  { key: 'twitter', label: 'Twitter', required: false, description: 'Twitter handle or URL' },
  { key: 'department', label: 'Department', required: false, description: 'Department or division' },
  { key: 'employee_count', label: 'Employee Count', required: false, description: 'Number of employees' },
  { key: 'revenue', label: 'Revenue', required: false, description: 'Annual revenue' },
  { key: 'lead_source', label: 'Lead Source', required: false, description: 'How the lead was acquired' },
  { key: 'notes', label: 'Notes', required: false, description: 'Additional notes or comments' },
  { key: 'tags', label: 'Tags', required: false, description: 'Tags separated by semicolons (;)' },
];

const CSVColumnMapper: React.FC<CSVColumnMapperProps> = ({
  csvData,
  onMappingComplete,
  onCancel,
}) => {
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [previewData, setPreviewData] = useState<MappedRecipient[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const headers = csvData[0] || [];
  const sampleRows = csvData.slice(1, 4); // Show first 3 rows as preview

  // Enhanced auto-detection logic for better column mapping
  const autoDetectMapping = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {};
    
    // Enhanced field patterns for better auto-detection
    const fieldPatterns: Record<string, string[]> = {
      email: ['email', 'e-mail', 'e_mail', 'mail', 'email_address', 'emailaddress'],
      firstName: ['first_name', 'firstname', 'first name', 'fname', 'given_name', 'givenname'],
      lastName: ['last_name', 'lastname', 'last name', 'lname', 'surname', 'family_name', 'familyname'],
      company: ['company', 'organization', 'org', 'business', 'employer', 'company_name', 'companyname'],
      position: ['position', 'title', 'job_title', 'jobtitle', 'role', 'designation', 'job_position'],
      phone: ['phone', 'telephone', 'tel', 'mobile', 'cell', 'phone_number', 'phonenumber', 'contact'],
      website: ['website', 'url', 'web', 'site', 'homepage', 'domain', 'web_site', 'website_url'],
      industry: ['industry', 'sector', 'business_type', 'vertical', 'market'],
      location: ['location', 'address', 'city', 'state', 'region', 'area', 'place'],
      country: ['country', 'nation', 'nationality', 'country_code'],
      linkedin: ['linkedin', 'linkedin_url', 'linkedin_profile', 'li_url', 'linkedin.com'],
      twitter: ['twitter', 'twitter_handle', 'twitter_url', '@', 'tweet', 'twitter.com'],
      department: ['department', 'dept', 'division', 'team', 'unit', 'group'],
      employee_count: ['employee_count', 'employees', 'staff_count', 'team_size', 'headcount', 'workforce'],
      revenue: ['revenue', 'sales', 'turnover', 'income', 'earnings', 'annual_revenue'],
      lead_source: ['lead_source', 'source', 'channel', 'origin', 'referral', 'campaign'],
      notes: ['notes', 'comments', 'remarks', 'description', 'memo', 'additional_info'],
      tags: ['tags', 'labels', 'categories', 'keywords', 'segments', 'groups']
    };
    
    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
      
      // Find the best matching system field
      for (const [systemField, patterns] of Object.entries(fieldPatterns)) {
        const isMatch = patterns.some(pattern => {
          const normalizedPattern = pattern.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          return normalizedHeader === normalizedPattern || 
                 normalizedHeader.includes(normalizedPattern) ||
                 normalizedPattern.includes(normalizedHeader);
        });
        
        if (isMatch && !Object.values(mapping).includes(systemField)) {
          mapping[header] = systemField;
          break;
        }
      }
    });
    
    return mapping;
  };

  // Auto-detect column mappings based on enhanced patterns
  useEffect(() => {
    const autoMapping = autoDetectMapping(headers);
    setMapping(autoMapping);
  }, [headers]);

  // Update preview data when mapping changes
  useEffect(() => {
    const mapped = csvData.slice(1).map(row => {
      const mappedRow: MappedRecipient = {};
      headers.forEach((header, index) => {
        const systemField = mapping[header];
        if (systemField) {
          mappedRow[systemField] = row[index]?.trim() || '';
        }
      });
      return mappedRow;
    });
    
    setPreviewData(mapped.slice(0, 3)); // Preview first 3 rows
    
    // Validate mapping
    const newErrors: string[] = [];
    const emailMapped = Object.values(mapping).includes('email');
    
    if (!emailMapped) {
      newErrors.push('Email field must be mapped');
    }
    
    // Check for duplicate mappings
    const mappedFields = Object.values(mapping).filter(Boolean);
    const uniqueFields = new Set(mappedFields);
    if (mappedFields.length !== uniqueFields.size) {
      newErrors.push('Each system field can only be mapped once');
    }
    
    setErrors(newErrors);
  }, [mapping, csvData, headers]);

  const handleMappingChange = (csvColumn: string, systemField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvColumn]: systemField === 'none' ? '' : systemField,
    }));
  };

  const handleComplete = () => {
    if (errors.length > 0) return;
    
    const mappedData = csvData.slice(1).map(row => {
      const mappedRow: MappedRecipient = {};
      headers.forEach((header, index) => {
        const systemField = mapping[header];
        if (systemField) {
          mappedRow[systemField] = row[index]?.trim() || '';
        }
      });
      return mappedRow;
    }).filter(row => row.email); // Only include rows with email
    
    onMappingComplete(mappedData, mapping);
  };

  const getMappedSystemField = (csvColumn: string) => {
    return mapping[csvColumn] || '';
  };

  const isSystemFieldMapped = (systemFieldKey: string) => {
    return Object.values(mapping).includes(systemFieldKey);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Map CSV Columns
          </CardTitle>
          <CardDescription>
            Map your CSV columns to system fields. Email is required, other fields are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mapping Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CSV Column</TableHead>
                  <TableHead>Sample Data</TableHead>
                  <TableHead>Map to System Field</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map((header, index) => {
                  const sampleValue = sampleRows[0]?.[index] || '';
                  const mappedField = getMappedSystemField(header);
                  const systemField = systemFields.find(f => f.key === mappedField);
                  
                  return (
                    <TableRow key={header}>
                      <TableCell className="font-medium">{header}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {sampleValue ? `"${sampleValue}"` : 'No data'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mappedField}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select field..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Don't map</SelectItem>
                            {systemFields.map(field => (
                              <SelectItem 
                                key={field.key} 
                                value={field.key}
                                disabled={isSystemFieldMapped(field.key) && mappedField !== field.key}
                              >
                                {field.label} {field.required ? '*' : null}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {mappedField ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mapped
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Not mapped
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* System Fields Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">System Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {systemFields.map(field => (
                    <div key={field.key} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{field.label}</span>
                        {field.required ? <span className="text-red-500 ml-1">*</span> : null}
                      </div>
                      {isSystemFieldMapped(field.key) ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {previewData.length > 0 ? (
                    <div className="space-y-2">
                      {previewData.map((row, index) => (
                        <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                          <div><strong>Email:</strong> {row.email || 'Not mapped'}</div>
                          {row.firstName && <div><strong>First Name:</strong> {row.firstName}</div>}
                          {row.lastName && <div><strong>Last Name:</strong> {row.lastName}</div>}
                          {row.company && <div><strong>Company:</strong> {row.company}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No preview available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Mapping Issues</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={errors.length > 0}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Import {csvData.length - 1} Recipients
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVColumnMapper;

