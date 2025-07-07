
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateQuestionDto } from '../types';
import { questionnaireService } from '../services/api';
import { useToast } from '../hooks/use-toast';

interface ManualQuestionFormProps {
  questionnaireId: string;
  onSuccess: () => void;
}

const ManualQuestionForm: React.FC<ManualQuestionFormProps> = ({ 
  questionnaireId, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateQuestionDto>({
    description: '',
    type: 'text',
    imageUrl: '',
    videoUrl: '',
    options: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (formData.description.length < 10) {
        toast({
          title: "Validation Error",
          description: "Question description must be at least 10 characters long",
          variant: "destructive",
        });
        return;
      }

      // Validate options for select, checkbox, radio types
      if (['select', 'checkbox', 'radio'].includes(formData.type) && (!formData.options || formData.options.length === 0)) {
        toast({
          title: "Validation Error",
          description: "This question type requires at least one option",
          variant: "destructive",
        });
        return;
      }

      // Clean up the data
      const questionData: CreateQuestionDto = {
        description: formData.description,
        type: formData.type,
        imageUrl: formData.imageUrl || undefined,
        videoUrl: formData.videoUrl || undefined,
        options: ['select', 'checkbox', 'radio'].includes(formData.type) ? formData.options : undefined,
      };

      await questionnaireService.addQuestion(questionnaireId, questionData);
      
      toast({
        title: "Success",
        description: "Question added successfully",
      });

      // Reset form
      setFormData({
        description: '',
        type: 'text',
        imageUrl: '',
        videoUrl: '',
        options: [],
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add question",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt) || []
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  const showOptions = ['select', 'checkbox', 'radio'].includes(formData.type);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Question</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Question Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter your question (minimum 10 characters)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Question Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: CreateQuestionDto['type']) => 
                setFormData(prev => ({ ...prev, type: value, options: value === 'text' || value === 'number' || value === 'date' ? [] : prev.options }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="select">Select (Dropdown)</SelectItem>
                <SelectItem value="checkbox">Checkbox (Multiple Choice)</SelectItem>
                <SelectItem value="radio">Radio (Single Choice)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (Optional)</Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://example.com/video.mp4"
                value={formData.videoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
              />
            </div>
          </div>

          {showOptions && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Options *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {(!formData.options || formData.options.length === 0) && (
                  <p className="text-sm text-gray-600">Click "Add Option" to add choices for this question</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding Question...' : 'Add Question'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManualQuestionForm;
