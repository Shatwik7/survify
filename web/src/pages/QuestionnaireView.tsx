
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Upload, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Questionnaire } from '../types';
import { questionnaireService } from '../services/api';
import { useToast } from '../hooks/use-toast';
import { usePolling } from '../hooks/usePolling';
import QuestionList from '../components/QuestionList';
import ManualQuestionForm from '../components/ManualQuestionForm';
import ExcelQuestionUpload from '../components/ExcelQuestionUpload';

const QuestionnaireView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');

  const fetchQuestionnaire = async () => {
    if (!id) return;
    
    try {
      const data = await questionnaireService.getById(id);
      setQuestionnaire(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questionnaire",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionnaire();
  }, [id]);

  // Poll for updates if questionnaire is being generated
  const { stopPolling } = usePolling({
    enabled: questionnaire?.status === 'queued',
    interval: 3000,
    onPoll: fetchQuestionnaire,
  });

  useEffect(() => {
    if (questionnaire?.status === 'completed' || questionnaire?.status === 'failed') {
      stopPolling();
    }
  }, [questionnaire?.status, stopPolling]);

  const handleStatusUpdate = async (newStatus: 'draft' | 'completed') => {
    if (!questionnaire) return;

    try {
      const updated = await questionnaireService.update(questionnaire.id, { status: newStatus });
      setQuestionnaire(updated);
      toast({
        title: "Success",
        description: `Questionnaire marked as ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update questionnaire status",
        variant: "destructive",
      });
    }
  };

  const handleQuestionAdded = () => {
    fetchQuestionnaire();
    setActiveTab('questions');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Questionnaire not found</h3>
        <Button onClick={() => navigate('/dashboard/questionnaires')}>
          Back to Questionnaires
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: Questionnaire['status']) => {
    const variants = {
      draft: { variant: 'secondary' as const, text: 'Draft' },
      queued: { variant: 'default' as const, text: 'Generating' },
      completed: { variant: 'default' as const, text: 'Completed' },
      failed: { variant: 'destructive' as const, text: 'Failed' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/questionnaires')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{questionnaire.title}</h1>
            <p className="text-gray-600">{questionnaire.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(questionnaire.status)}
          {questionnaire.status === 'draft' && (
            <Button onClick={() => handleStatusUpdate('completed')}>
              <Save className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Questions ({questionnaire.questions?.length || 0})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="questions">View Questions</TabsTrigger>
              <TabsTrigger value="manual">Add Manually</TabsTrigger>
              <TabsTrigger value="excel">Upload Excel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="questions" className="mt-6">
              <QuestionList 
                questions={questionnaire.questions || []}
                onRefresh={fetchQuestionnaire}
              />
            </TabsContent>
            
            <TabsContent value="manual" className="mt-6">
              <ManualQuestionForm 
                questionnaireId={questionnaire.id}
                onSuccess={handleQuestionAdded}
              />
            </TabsContent>
            
            <TabsContent value="excel" className="mt-6">
              <ExcelQuestionUpload 
                questionnaireId={questionnaire.id}
                onSuccess={handleQuestionAdded}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionnaireView;
