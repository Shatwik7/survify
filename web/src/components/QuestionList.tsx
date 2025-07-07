
import React from 'react';
import { Edit, Trash2, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Question } from '../types';

interface QuestionListProps {
  questions: Question[];
  onRefresh: () => void;
}

const QuestionList: React.FC<QuestionListProps> = ({ questions, onRefresh }) => {
  const getQuestionTypeBadge = (type: Question['type']) => {
    const typeLabels = {
      text: 'Text',
      number: 'Number',
      date: 'Date',
      select: 'Select',
      checkbox: 'Checkbox',
      radio: 'Radio',
    };

    return <Badge variant="outline">{typeLabels[type]}</Badge>;
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Edit className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No questions yet</h3>
        <p className="text-gray-600 mb-6">
          Add your first question manually or upload an Excel file to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base font-medium text-gray-900 mb-2">
                  Question {index + 1}
                </CardTitle>
                <p className="text-gray-700">{question.description}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {getQuestionTypeBadge(question.type)}
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Media attachments */}
            {(question.imageUrl || question.videoUrl) && (
              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                {question.imageUrl && (
                  <div className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    <span>Image attached</span>
                  </div>
                )}
                {question.videoUrl && (
                  <div className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    <span>Video attached</span>
                  </div>
                )}
              </div>
            )}

            {/* Options for select, checkbox, radio */}
            {question.options && question.options.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Options:</h4>
                <div className="grid gap-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 border border-gray-300 rounded flex-shrink-0"></div>
                      <span className="text-gray-700">{option}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview based on question type */}
            {question.type === 'text' && (
              <div className="mt-3">
                <input 
                  type="text" 
                  placeholder="Text answer will appear here..."
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  disabled
                />
              </div>
            )}

            {question.type === 'number' && (
              <div className="mt-3">
                <input 
                  type="number" 
                  placeholder="Number answer will appear here..."
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  disabled
                />
              </div>
            )}

            {question.type === 'date' && (
              <div className="mt-3">
                <input 
                  type="date" 
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  disabled
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuestionList;
