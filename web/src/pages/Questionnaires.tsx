
import React, { useState } from 'react';
import QuestionnaireList from '../components/QuestionnaireList';
import CreateQuestionnaireModal from '../components/CreateQuestionnaireModal';
import AIQuestionnaireModal from '../components/AIQuestionnaireModal';

const Questionnaires = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <QuestionnaireList
        key={refreshKey}
        onCreateNew={() => setShowCreateModal(true)}
        onCreateWithAI={() => setShowAIModal(true)}
      />

      <CreateQuestionnaireModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSuccess}
      />

      <AIQuestionnaireModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default Questionnaires;
