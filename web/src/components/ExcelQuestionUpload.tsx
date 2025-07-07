
import React, { useState, useCallback } from 'react';
import { Upload, Download, FileSpreadsheet, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { CreateQuestionDto, ExcelQuestionRow } from '../types';
import { questionnaireService } from '../services/api';
import { useToast } from '../hooks/use-toast';

interface ExcelQuestionUploadProps {
  questionnaireId: string;
  onSuccess: () => void;
}

const ExcelQuestionUpload: React.FC<ExcelQuestionUploadProps> = ({ 
  questionnaireId, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ExcelQuestionRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const downloadTemplate = () => {
    const templateData = [
      {
        serialNo: 1,
        description: "What is your name?",
        type: "text",
        option_1: "",
        option_2: "",
        option_3: "",
        option_4: "",
        option_5: ""
      },
      {
        serialNo: 2,
        description: "What is your age?",
        type: "number",
        option_1: "",
        option_2: "",
        option_3: "",
        option_4: "",
        option_5: ""
      },
      {
        serialNo: 3,
        description: "What is your favorite color?",
        type: "select",
        option_1: "Red",
        option_2: "Blue",
        option_3: "Green",
        option_4: "Yellow",
        option_5: ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(workbook, "questionnaire_template.xlsx");
  };

  const validateQuestions = (data: ExcelQuestionRow[]): string[] => {
    const errors: string[] = [];
    const validTypes = ['text', 'number', 'date', 'select', 'checkbox', 'radio'];

    data.forEach((row, index) => {
      const rowNum = index + 1;
      
      if (!row.description || row.description.length < 10) {
        errors.push(`Row ${rowNum}: Description must be at least 10 characters long`);
      }
      
      if (!validTypes.includes(row.type)) {
        errors.push(`Row ${rowNum}: Invalid question type "${row.type}". Must be one of: ${validTypes.join(', ')}`);
      }
      
      if (['select', 'checkbox', 'radio'].includes(row.type)) {
        const options = [row.option_1, row.option_2, row.option_3, row.option_4, row.option_5]
          .filter(opt => opt && opt.trim().length > 0);
        
        if (options.length === 0) {
          errors.push(`Row ${rowNum}: Question type "${row.type}" requires at least one option`);
        }
      }
    });

    return errors;
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelQuestionRow[];

        if (jsonData.length === 0) {
          toast({
            title: "Error",
            description: "Excel file is empty",
            variant: "destructive",
          });
          return;
        }

        // Validate the data
        const errors = validateQuestions(jsonData);
        setValidationErrors(errors);
        setPreviewData(jsonData);

        if (errors.length === 0) {
          toast({
            title: "Success",
            description: `${jsonData.length} questions loaded successfully`,
          });
        } else {
          toast({
            title: "Validation Issues",
            description: `Found ${errors.length} validation error(s). Please fix them before uploading.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to read Excel file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleUpload = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Cannot Upload",
        description: "Please fix validation errors first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const questions: CreateQuestionDto[] = previewData.map(row => {
        const options = [row.option_1, row.option_2, row.option_3, row.option_4, row.option_5]
          .filter(opt => opt && opt.trim().length > 0);

        return {
          description: row.description,
          type: row.type,
          options: ['select', 'checkbox', 'radio'].includes(row.type) ? options : undefined,
        };
      });

      await questionnaireService.addQuestions(questionnaireId, questions);
      
      toast({
        title: "Success",
        description: `${questions.length} questions uploaded successfully`,
      });

      setPreviewData([]);
      setValidationErrors([]);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Questions from Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Step 1: Download Template</h4>
              <p className="text-sm text-gray-600">Download the Excel template with the correct format</p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Step 2: Upload Your File</h4>
                <p className="text-sm text-gray-600">Upload your completed Excel file</p>
              </div>
              <div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload">
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {validationErrors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <X className="h-5 w-5" />
              Validation Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-600 text-sm">• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Preview Questions ({previewData.length})
              </CardTitle>
              <Button 
                onClick={handleUpload} 
                disabled={loading || validationErrors.length > 0}
              >
                {loading ? 'Uploading...' : 'Upload Questions'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead>Options</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.serialNo || index + 1}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={row.description}>
                          {row.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {[row.option_1, row.option_2, row.option_3, row.option_4, row.option_5]
                            .filter(opt => opt && opt.trim().length > 0)
                            .join(', ') || 'No options'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExcelQuestionUpload;
