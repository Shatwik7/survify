
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Download, Info } from 'lucide-react';

interface ExcelTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExcelTemplateModal: React.FC<ExcelTemplateModalProps> = ({
  open,
  onOpenChange,
}) => {
  const downloadTemplate = () => {
    // Create a simple CSV template
    const headers = ['email', 'phone', 'name', 'age', 'city', 'department'];
    const sampleData = [
      'john.doe@example.com,+1234567890,John Doe,25,New York,Engineering',
      'jane.smith@example.com,+1234567891,Jane Smith,30,San Francisco,Marketing',
      'bob.johnson@example.com,+1234567892,Bob Johnson,28,Chicago,Sales'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'population_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Template Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Required Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Your Excel file must have the following column structure:
              </p>
              <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
                <div className="grid grid-cols-6 gap-2 font-bold mb-2">
                  <span>email</span>
                  <span>phone</span>
                  <span>name</span>
                  <span>age</span>
                  <span>city</span>
                  <span>department</span>
                </div>
                <div className="grid grid-cols-6 gap-2 text-gray-600">
                  <span>Required</span>
                  <span>Optional</span>
                  <span>Required</span>
                  <span>Custom</span>
                  <span>Custom</span>
                  <span>Custom</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Column Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700">Required Columns:</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• <strong>email</strong> - Valid email address (unique identifier)</li>
                  <li>• <strong>name</strong> - Full name of the person</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-700">Optional Columns:</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• <strong>phone</strong> - Phone number</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-700">Custom Fields:</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Add any additional columns for custom data</li>
                  <li>• Examples: age, city, department, salary, etc.</li>
                  <li>• Values will be automatically typed (string, number, date, boolean)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sample Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">email</th>
                      <th className="text-left p-1">phone</th>
                      <th className="text-left p-1">name</th>
                      <th className="text-left p-1">age</th>
                      <th className="text-left p-1">city</th>
                      <th className="text-left p-1">department</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr>
                      <td className="p-1">john.doe@example.com</td>
                      <td className="p-1">+1234567890</td>
                      <td className="p-1">John Doe</td>
                      <td className="p-1">25</td>
                      <td className="p-1">New York</td>
                      <td className="p-1">Engineering</td>
                    </tr>
                    <tr>
                      <td className="p-1">jane.smith@example.com</td>
                      <td className="p-1">+1234567891</td>
                      <td className="p-1">Jane Smith</td>
                      <td className="p-1">30</td>
                      <td className="p-1">San Francisco</td>
                      <td className="p-1">Marketing</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
