
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Questionnaires from "./pages/Questionnaires";
import QuestionnaireView from "./pages/QuestionnaireView";
import NotFound from "./pages/NotFound";
import Population from "./pages/Population";
import PopulationDetails from "./pages/PopulationDetails";
import Surveys from "./pages/Surveys";
import SurveyResponse from "./pages/SurveyResponse";
import SurveyDetails from "./pages/SurveyDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/survey/:jwt" element={<SurveyResponse />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard/questionnaires" replace />} />
              <Route path="questionnaires" element={<Questionnaires />} />
              <Route path="questionnaire/:id" element={<QuestionnaireView />} />
              <Route path="population" element={<Population />} />
              <Route path="population/:id" element={<PopulationDetails />} />
              <Route path="surveys" element={<Surveys />} />
              <Route path="survey/:id" element={<SurveyDetails />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
