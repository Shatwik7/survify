
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Calendar, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Questionnaire } from '../types';
import { questionnaireService } from '../services/api';
import { useToast } from '../hooks/use-toast';

interface QuestionnaireListProps {
  onCreateNew: () => void;
  onCreateWithAI: () => void;
}

const QuestionnaireList: React.FC<QuestionnaireListProps> = ({ onCreateNew, onCreateWithAI }) => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQuestionnaires = async () => {
    try {
      const data = await questionnaireService.getAll();
      setQuestionnaires(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questionnaires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  const getStatusBadge = (status: Questionnaire['status']) => {
    const variants = {
      draft: { variant: 'secondary' as const, icon: FileText, text: 'Draft' },
      queued: { variant: 'default' as const, icon: Clock, text: 'Generating' },
      completed: { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
      failed: { variant: 'destructive' as const, icon: AlertCircle, text: 'Failed' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this questionnaire?')) {
      try {
        await questionnaireService.delete(id);
        setQuestionnaires(prev => prev.filter(q => q.id !== id));
        toast({
          title: "Success",
          description: "Questionnaire deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete questionnaire",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Questionnaires</h2>
          <div className="flex gap-3">
            <Button disabled className="bg-gradient-to-r from-purple-600 to-pink-600">
              <Plus className="h-4 w-4 mr-2" />
              Create with AI
            </Button>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              New Questionnaire
            </Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Questionnaires</h2>
        <div className="flex gap-3">
          <Button 
            onClick={onCreateWithAI}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create with AI
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Questionnaire
          </Button>
        </div>
      </div>

      {questionnaires.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No questionnaires yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first questionnaire to get started with collecting valuable insights.
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={onCreateWithAI}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create with AI
              </Button>
              <Button onClick={onCreateNew} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {questionnaires.map((questionnaire) => (
            <Link key={questionnaire.id} to={`/dashboard/questionnaire/${questionnaire.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full relative group">
                <button
                  onClick={(e) => handleDelete(questionnaire.id, e)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                >
                  <X className="h-3 w-3" />
                </button>
                
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 pr-8">
                      {questionnaire.title}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {questionnaire.description}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-3">
                    {getStatusBadge(questionnaire.status)}
                    <span className="text-sm text-gray-500">
                      {questionnaire.questions?.length || 0} questions
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(questionnaire.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionnaireList;
