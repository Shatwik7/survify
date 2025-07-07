
import React, { useState } from 'react';
import { X, Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { questionnaireService } from '../services/api';
import { useToast } from '../hooks/use-toast';

interface AIQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AIQuestionnaireModal: React.FC<AIQuestionnaireModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productService: '',
    targetUsers: '',
    numberOfQuestions: '',
    additionalInfo: '',
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    const prompt = `
      Product/Service: ${formData.productService}
      Target Users: ${formData.targetUsers}
      Number of Questions: ${formData.numberOfQuestions}
      Additional Information: ${formData.additionalInfo}
      
      Please create a comprehensive questionnaire with the specified number of questions that will help gather valuable insights from the target users about the product/service.
    `;

    try {
      await questionnaireService.createUsingAI({
        title: formData.title,
        description: formData.description,
        prompt: prompt.trim(),
      });

      toast({
        title: "AI Questionnaire Creation Started",
        description: "Your questionnaire is being generated. This may take a few minutes.",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create questionnaire",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      title: '',
      description: '',
      productService: '',
      targetUsers: '',
      numberOfQuestions: '',
      additionalInfo: '',
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.title.trim() && formData.description.trim();
      case 2:
        return formData.productService.trim();
      case 3:
        return formData.targetUsers.trim();
      case 4:
        return formData.numberOfQuestions.trim();
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 rounded-lg">
              <Brain className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-semibold">
              Create Questionnaire with AI
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 mb-6">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    num <= step
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {num}
                </div>
                {num < 4 && (
                  <div
                    className={`w-12 h-0.5 ${
                      num < step ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Questionnaire Title *
                </label>
                <Input
                  placeholder="Enter a descriptive title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Description *
                </label>
                <Textarea
                  placeholder="Briefly describe the purpose of this questionnaire"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Product/Service */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product/Service Description</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Describe your product or service *
                </label>
                <Textarea
                  placeholder="Provide detailed information about what you're offering, including key features, benefits, and unique selling points..."
                  value={formData.productService}
                  onChange={(e) => handleInputChange('productService', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 3: Target Users */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Target Users</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Describe your target audience *
                </label>
                <Textarea
                  placeholder="Who are your target users? Include demographics, behaviors, needs, and any other relevant characteristics..."
                  value={formData.targetUsers}
                  onChange={(e) => handleInputChange('targetUsers', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 4: Final Details */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Final Details</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Number of Questions *
                </label>
                <Input
                  type="number"
                  placeholder="How many questions do you want? (e.g., 10)"
                  value={formData.numberOfQuestions}
                  onChange={(e) => handleInputChange('numberOfQuestions', e.target.value)}
                  min="1"
                  max="50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Additional Information (Optional)
                </label>
                <Textarea
                  placeholder="Any specific requirements, question types you prefer, or additional context..."
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 1 || isLoading}
            >
              Previous
            </Button>

            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Questionnaire'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIQuestionnaireModal;
