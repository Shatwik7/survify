
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Eye, CheckCircle, Calendar, Send, Download, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Survey, SurveyStats, SurveyJobStatus } from '../types';
import { surveyService } from '../services/api';
import { useToast } from '../hooks/use-toast';

const SurveyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [jobStatus, setJobStatus] = useState<SurveyJobStatus | null>(null);

  const fetchSurveyData = async () => {
    if (!id) return;
    
    try {
      const [surveyData, statsData, jobStatusData] = await Promise.all([
        surveyService.getById(id),
        surveyService.getStats(id),
        surveyService.getSurveyJobStatus(id)
      ]);
      setSurvey(surveyData);
      setStats(statsData);
      setJobStatus(jobStatusData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch survey data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveyData();
  }, [id]);

  // Auto-refresh when survey is being processed
  useEffect(() => {
    if (!survey || (survey.sendJobStatus !== 'Queued' && survey.sendJobStatus !== 'Processing')) {
      return;
    }

    const interval = setInterval(() => {
      fetchSurveyData();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [survey?.sendJobStatus, survey?.id]);

  const handleSendSurvey = async () => {
    if (!survey) return;
    
    setSending(true);
    try {
      const response = await surveyService.sendSurveyLinks(survey.id);
      setJobStatus(response);
      toast({
        title: "Success",
        description: "Survey sending job queued successfully",
      });
      fetchSurveyData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send survey links",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDownloadAnswers = async () => {
    if (!survey) return;
    
    setDownloading(true);
    try {
      const blob = await surveyService.downloadAnswers(survey.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey_${survey.id}_answers.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Survey answers downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download survey answers",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (survey: Survey) => {
    const jobStatus = survey.sendJobStatus;
    
    if (new Date(survey.expiresAt) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    const variants = {
      NotStarted: { variant: 'secondary' as const, text: 'Not Started', icon: null },
      Queued: { variant: 'default' as const, text: 'Queued', icon: <Clock className="h-3 w-3 mr-1" /> },
      Processing: { variant: 'default' as const, text: 'Processing', icon: <Clock className="h-3 w-3 mr-1" /> },
      Completed: { variant: 'default' as const, text: 'Completed', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      Failed: { variant: 'destructive' as const, text: 'Failed', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    };

    const config = variants[jobStatus];
    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {config.text}
      </Badge>
    );
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

  if (!survey) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Survey not found</h3>
        <Button onClick={() => navigate('/dashboard/surveys')}>
          Back to Surveys
        </Button>
      </div>
    );
  }

  const responseRate = stats ? (stats.total > 0 ? (stats.completed / stats.total) * 100 : 0) : 0;
  const viewRate = stats ? (stats.total > 0 ? (stats.seen / stats.total) * 100 : 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/surveys')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Survey #{survey.id.slice(-8)}</h1>
            <p className="text-gray-600">Created on {new Date(survey.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(survey)}
          <Button 
            onClick={handleDownloadAnswers} 
            disabled={downloading}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download Answers'}
          </Button>
          {survey.sendJobStatus === 'NotStarted' && (
            <Button onClick={handleSendSurvey} disabled={sending}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Survey'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewed</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.seen || 0}</div>
            <p className="text-xs text-muted-foreground">
              {viewRate.toFixed(1)}% view rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {responseRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Job Progress Section */}
      {survey.sendJobStatus === 'Queued' || survey.sendJobStatus === 'Processing' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sending Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{survey.sendProgress}%</span>
                </div>
                <Progress value={survey.sendProgress} className="h-2" />
              </div>
              <div className="text-sm text-gray-600">
                <div>Status: {survey.sendJobStatus}</div>
                {survey.sendJobStartedAt && (
                  <div>Started: {new Date(survey.sendJobStartedAt).toLocaleString()}</div>
                )}
                {survey.sendJobCompletedAt && (
                  <div>Completed: {new Date(survey.sendJobCompletedAt).toLocaleString()}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Survey Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Questionnaire ID:</strong>{' '}
                      <button
                        onClick={() => navigate(`/dashboard/questionnaire/${survey.questionnaireId}`)}
                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      >
                        {survey.questionnaireId}
                      </button>
                    </div>
                    <div>
                      <strong>Population ID:</strong>{' '}
                      <button
                        onClick={() => navigate(`/dashboard/population/${survey.populationId}`)}
                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      >
                        {survey.populationId}
                      </button>
                    </div>
                    <div><strong>Expires:</strong> {new Date(survey.expiresAt).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Delivery Methods</h4>
                  <div className="flex gap-2">
                    {survey.deliveryModes.map(mode => (
                      <Badge key={mode} variant="outline" className="capitalize">
                        {mode}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="progress" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>View Rate</span>
                    <span>{viewRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={viewRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Completion Rate</span>
                    <span>{responseRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={responseRate} className="h-2" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveyDetails;
