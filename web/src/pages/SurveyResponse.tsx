
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { surveyService } from '../services/api';
import { useToast } from '../hooks/use-toast';
import type { Question } from '../types';

const SurveyResponse = () => {
  const { jwt } = useParams<{ jwt: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [surveyData, setSurveyData] = useState<{
    surveyId: string;
    questionnaire: {
      id: string;
      title: string;
      description?: string;
      questions: Question[];
    };
  } | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: string[] }>({});

  useEffect(() => {
    if (jwt) {
      fetchSurveyData();
    }
  }, [jwt]);

  const fetchSurveyData = async () => {
    try {
      console.log('Fetching survey data for JWT:', jwt);
      const data = await surveyService.getSurveyWithQuestions(jwt!);
      console.log('Survey data:', data);
      setSurveyData(data);
    } catch (error) {
      console.error('Error fetching survey:', error);
      toast({
        title: "Error",
        description: "Failed to load survey",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: Array.isArray(value) ? value : [value]
    }));
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentAnswers, option]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter(answer => answer !== option)
        };
      }
    });
  };

  const handleSubmit = async () => {
    if (!jwt) return;

    // Validate that all questions are answered
    const unansweredQuestions = surveyData?.questionnaire.questions.filter(
      question => !answers[question.id] || answers[question.id].length === 0
    );

    if (unansweredQuestions && unansweredQuestions.length > 0) {
      toast({
        title: "Error",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      console.log('Submitting answers:', { jwt, answers });
      await surveyService.submitAnswers({ jwt, answers });
      toast({
        title: "Success",
        description: "Your responses have been submitted successfully",
      });
      navigate('/');
    } catch (error) {
      console.error('Error submitting answers:', error);
      toast({
        title: "Error",
        description: "Failed to submit responses",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const currentAnswer = answers[question.id] || [];

    switch (question.type) {
      case 'text':
        return (
          <Textarea
            value={currentAnswer[0] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="min-h-[100px]"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentAnswer[0] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter a number..."
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={currentAnswer[0] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={currentAnswer[0] || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={currentAnswer[0] || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option}`}
                  checked={currentAnswer.includes(option)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange(question.id, option, checked as boolean)
                  }
                />
                <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!surveyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Survey Not Found</h2>
              <p className="text-gray-600">The survey you're looking for doesn't exist or has expired.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {surveyData.questionnaire.title}
            </CardTitle>
            {surveyData.questionnaire.description && (
              <p className="text-gray-600 text-center mt-2">
                {surveyData.questionnaire.description}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {surveyData.questionnaire.questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <Label className="text-base font-medium text-gray-900 block mb-3">
                      {question.description}
                      {question.imageUrl && (
                        <img 
                          src={question.imageUrl} 
                          alt="Question" 
                          className="mt-2 max-w-full h-auto rounded-lg"
                        />
                      )}
                      {question.videoUrl && (
                        <video 
                          src={question.videoUrl} 
                          controls 
                          className="mt-2 max-w-full h-auto rounded-lg"
                        />
                      )}
                    </Label>
                    {renderQuestion(question)}
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-6 border-t">
              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? 'Submitting...' : 'Submit Survey'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SurveyResponse;
