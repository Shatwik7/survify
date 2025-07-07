
import React, { useState } from 'react';
import SurveyList from '../components/SurveyList';
import CreateSurveyModal from '../components/CreateSurveyModal';

const Surveys = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <SurveyList
        key={refreshKey}
        onCreateNew={() => setShowCreateModal(true)}
      />

      <CreateSurveyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default Surveys;
