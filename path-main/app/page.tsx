'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingForm } from '@/components/onboarding-form';
import {
  GraphWorkspace,
  GraphLoadingState,
  GraphErrorState,
} from '@/components/graph-workspace';
import { Roadmap, UserProfile } from '@/lib/types';
import {
  saveRoadmap,
  loadRoadmap,
  saveProfile,
  loadProfile,
  clearRoadmap,
} from '@/lib/storage';

type ViewState = 'onboarding' | 'loading' | 'workspace' | 'error';

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>('onboarding');
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedRoadmap = loadRoadmap();
    const savedProfile = loadProfile<UserProfile>();
    if (savedRoadmap && savedProfile) {
      setRoadmap(savedRoadmap);
      setProfile(savedProfile);
      setViewState('workspace');
    }
  }, []);

  const handleFormSubmit = useCallback(async (userProfile: UserProfile) => {
    setProfile(userProfile);
    saveProfile(userProfile);
    setViewState('loading');
    setError(null);
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate roadmap');
      }
      const generatedRoadmap = (await res.json()) as Roadmap;
      setRoadmap(generatedRoadmap);
      saveRoadmap(generatedRoadmap);
      setViewState('workspace');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setViewState('error');
    }
  }, []);

  const handleRoadmapUpdate = useCallback((updated: Roadmap) => {
    setRoadmap(updated);
    saveRoadmap(updated);
  }, []);

  const handleReset = useCallback(() => {
    clearRoadmap();
    setRoadmap(null);
    setProfile(null);
    setError(null);
    setViewState('onboarding');
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setViewState('onboarding');
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {viewState === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen flex items-center justify-center px-4 py-12"
          >
            <OnboardingForm
              onSubmit={handleFormSubmit}
              isLoading={false}
              error={null}
            />
          </motion.div>
        )}

        {viewState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GraphLoadingState />
          </motion.div>
        )}

        {viewState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GraphErrorState error={error ?? 'Unknown error'} onRetry={handleRetry} />
          </motion.div>
        )}

        {viewState === 'workspace' && roadmap && profile && (
          <motion.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen"
          >
            <GraphWorkspace
              roadmap={roadmap}
              profile={profile}
              onRoadmapUpdate={handleRoadmapUpdate}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
