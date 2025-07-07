
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3, Calendar, CheckCircle, Clock, AlertCircle, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Survey } from '../types';
import { surveyService } from '../services/api';
import { useToast } from '../hooks/use-toast';

interface SurveyListProps {
  onCreateNew: () => void;
}

const SurveyList: React.FC<SurveyListProps> = ({ onCreateNew }) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSurveys = async () => {
    try {
      const data = await surveyService.getAll();
      setSurveys(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch surveys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const getStatusBadge = (survey: Survey) => {
    // Determine status based on survey properties
    let status: 'draft' | 'sent' | 'active' | 'expired' = 'draft';
    
    if (new Date(survey.expiresAt) < new Date()) {
      status = 'expired';
    } else if (survey.analyzed) {
      status = 'active';
    } else {
      status = 'draft';
    }

    const variants = {
      draft: { variant: 'secondary' as const, icon: Clock, text: 'Draft' },
      sent: { variant: 'default' as const, icon: Send, text: 'Sent' },
      active: { variant: 'default' as const, icon: CheckCircle, text: 'Active' },
      expired: { variant: 'destructive' as const, icon: AlertCircle, text: 'Expired' },
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

  const handleSendSurvey = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSendingId(id);
    try {
      await surveyService.sendSurveyLinks(id);
      toast({
        title: "Success",
        description: "Survey links sent successfully",
      });
      fetchSurveys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send survey links",
        variant: "destructive",
      });
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Surveys</h2>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            New Survey
          </Button>
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
        <h2 className="text-2xl font-bold text-gray-900">My Surveys</h2>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Survey
        </Button>
      </div>

      {surveys.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No surveys yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first survey to start collecting responses from your audience.
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Survey
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => (
            <Link key={survey.id} to={`/dashboard/survey/${survey.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      Survey #{survey.id.slice(-8)}
                    </CardTitle>
                    {!survey.analyzed && (
                      <Button
                        size="sm"
                        variant="outline" 
                        onClick={(e) => handleSendSurvey(survey.id, e)}
                        className="ml-2"
                        disabled={sendingId === survey.id}
                      >
                        {sendingId === survey.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    Questionnaire ID: {survey.questionnaireId.slice(-8)}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-3">
                    {getStatusBadge(survey)}
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      Population: {survey.populationId.slice(-8)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Expires: {new Date(survey.expiresAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-1">
                      {survey.deliveryModes.includes('email') && (
                        <Badge variant="outline" className="text-xs">Email</Badge>
                      )}
                      {survey.deliveryModes.includes('whatsapp') && (
                        <Badge variant="outline" className="text-xs">WhatsApp</Badge>
                      )}
                    </div>
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

export default SurveyList;
