import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import OnboardingPage from "../pages/OnboardingPage";
import TutorialPage from "../pages/TutorialPage";
import GamePage from "../pages/GamePage";
import ResultPage from "../pages/ResultPage";
import PostSurveyPage from "../pages/PostSurveyPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/onboarding" replace />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/tutorial" element={<TutorialPage />} />
      <Route path="/game/:sessionId" element={<GamePage />} />
      <Route path="/result/:sessionId" element={<ResultPage />} />
      <Route path="/survey/:sessionId" element={<PostSurveyPage />} />
    </Routes>
  );
}