
import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { surveyService, questionnaireService, populationService } from '../services/api';
import { useToast } from '../hooks/use-toast';
import type { Questionnaire, Population } from '../types';

interface CreateSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSurveyModal: React.FC<CreateSurveyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    questionnaireId: '',
    populationId: '',
    deliveryModes: [] as ('email' | 'whatsapp')[],
    expiresAt: '',
  });
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [populations, setPopulations] = useState<Population[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Set default expiry date (7 days from now)
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7);
      setFormData(prev => ({
        ...prev,
        expiresAt: defaultExpiry.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      console.log('Fetching questionnaires and populations...');
      const [questionnaireData, populationData] = await Promise.all([
        questionnaireService.getAll(),
        populationService.getAll()
      ]);
      
      console.log('Questionnaires:', questionnaireData);
      console.log('Populations:', populationData);
      
      // Filter questionnaires that have questi
      // Filter populations that are completed
      const validPopulations = populationData.filter(p => p.status === 'completed');
      
      setQuestionnaires(questionnaireData);
      setPopulations(validPopulations);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load questionnaires and populations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.deliveryModes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one delivery mode",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await surveyService.create({
        ...formData,
        expiresAt: new Date(formData.expiresAt).toISOString()
      });
      toast({
        title: "Success",
        description: "Survey created successfully",
      });
      onSuccess();
      onClose();
      setFormData({
        questionnaireId: '',
        populationId: '',
        deliveryModes: [],
        expiresAt: '',
      });
    } catch (error: unknown) {
      console.error('Error creating survey:', error);
      const errorMessage = error instanceof Error ? error.message : 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create survey";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeliveryModeChange = (mode: 'email' | 'whatsapp', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      deliveryModes: checked 
        ? [...prev.deliveryModes, mode]
        : prev.deliveryModes.filter(m => m !== mode)
    }));
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        questionnaireId: '',
        populationId: '',
        deliveryModes: [],
        expiresAt: '',
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl font-semibold">Create New Survey</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading data...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="questionnaire">Questionnaire *</Label>
                <Select
                  value={formData.questionnaireId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, questionnaireId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a questionnaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionnaires.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        <div>
                          <div className="font-medium">{q.title}</div>
                          <div className="text-sm text-gray-500">{q.description}</div>
                          <div className="text-xs text-gray-400">({q.questions?.length || 0} questions)</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {questionnaires.length === 0 && (
                  <p className="text-sm text-gray-500">No questionnaires with questions available</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="population">Population *</Label>
                <Select
                  value={formData.populationId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, populationId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a population" />
                  </SelectTrigger>
                  <SelectContent>
                    {populations.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {populations.length === 0 && (
                  <p className="text-sm text-gray-500">No completed populations available</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Delivery Methods *</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email"
                      checked={formData.deliveryModes.includes('email')}
                      onCheckedChange={(checked) => handleDeliveryModeChange('email', checked as boolean)}
                    />
                    <Label htmlFor="email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="whatsapp"
                      checked={formData.deliveryModes.includes('whatsapp')}
                      onCheckedChange={(checked) => handleDeliveryModeChange('whatsapp', checked as boolean)}
                    />
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires On *</Label>
                <div className="relative">
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || questionnaires.length === 0 || populations.length === 0}>
                  {isLoading ? 'Creating...' : 'Create Survey'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSurveyModal;
