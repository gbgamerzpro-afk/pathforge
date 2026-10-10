'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Building2,
  GraduationCap,
  Tags,
  Clock,
  CalendarDays,
  MapPin,
  Wallet,
  Sparkles,
  Loader2,
  X,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserProfile } from '@/lib/types';

interface OnboardingFormProps {
  onSubmit: (profile: UserProfile) => void;
  isLoading: boolean;
  error: string | null;
}

const SAMPLES: { label: string; profile: UserProfile }[] = [
  {
    label: 'Full Stack Developer at a Climate-Tech Startup',
    profile: {
      dreamJobTitle: 'Full Stack Developer',
      targetCompanyType: 'Climate-tech startup',
      currentStage: 'CS student, 2nd year',
      existingSkills: ['JavaScript', 'HTML', 'CSS', 'Git'],
      weeklyHours: 15,
      timeframeWeeks: 24,
      preferredLocation: 'Remote / San Francisco',
      budgetPreference: 'Prefer free resources',
    },
  },
  {
    label: 'AI Engineer at a Fintech Company',
    profile: {
      dreamJobTitle: 'AI Engineer',
      targetCompanyType: 'Fintech company',
      currentStage: 'Junior backend developer, 1 year experience',
      existingSkills: ['Python', 'SQL', 'REST APIs', 'Docker'],
      weeklyHours: 20,
      timeframeWeeks: 32,
      preferredLocation: 'New York',
      budgetPreference: 'Willing to pay for courses',
    },
  },
  {
    label: 'Frontend Engineer at Google',
    profile: {
      dreamJobTitle: 'Frontend Engineer',
      targetCompanyType: 'Google (FAANG)',
      currentStage: 'Bootcamp graduate, self-taught',
      existingSkills: ['React', 'TypeScript', 'CSS', 'Jest'],
      weeklyHours: 25,
      timeframeWeeks: 20,
      preferredLocation: 'Mountain View, CA',
      budgetPreference: 'Prefer free resources',
    },
  },
];

export function OnboardingForm({ onSubmit, isLoading, error }: OnboardingFormProps) {
  const [dreamJobTitle, setDreamJobTitle] = useState('');
  const [targetCompanyType, setTargetCompanyType] = useState('');
  const [currentStage, setCurrentStage] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [existingSkills, setExistingSkills] = useState<string[]>([]);
  const [weeklyHours, setWeeklyHours] = useState('15');
  const [timeframeWeeks, setTimeframeWeeks] = useState('24');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [budgetPreference, setBudgetPreference] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const addSkill = useCallback(() => {
    const trimmed = skillInput.trim();
    if (trimmed && !existingSkills.includes(trimmed)) {
      setExistingSkills([...existingSkills, trimmed]);
      setSkillInput('');
    }
  }, [skillInput, existingSkills]);

  const removeSkill = useCallback(
    (skill: string) => {
      setExistingSkills(existingSkills.filter((s) => s !== skill));
    },
    [existingSkills]
  );

  const handleSkillKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addSkill();
      }
    },
    [addSkill]
  );

  const loadSample = useCallback((sample: UserProfile) => {
    setDreamJobTitle(sample.dreamJobTitle);
    setTargetCompanyType(sample.targetCompanyType);
    setCurrentStage(sample.currentStage);
    setExistingSkills(sample.existingSkills);
    setWeeklyHours(String(sample.weeklyHours));
    setTimeframeWeeks(String(sample.timeframeWeeks));
    setPreferredLocation(sample.preferredLocation);
    setBudgetPreference(sample.budgetPreference ?? '');
    setValidationErrors({});
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (dreamJobTitle.trim().length < 2) errors.dreamJobTitle = 'Enter your dream job title';
    if (targetCompanyType.trim().length < 2) errors.targetCompanyType = 'Enter a target company or type';
    if (currentStage.trim().length < 2) errors.currentStage = 'Enter your current stage';
    if (preferredLocation.trim().length < 1) errors.preferredLocation = 'Enter a preferred location';
    const wh = parseInt(weeklyHours, 10);
    if (isNaN(wh) || wh < 1 || wh > 80) errors.weeklyHours = 'Enter 1-80 hours per week';
    const tw = parseInt(timeframeWeeks, 10);
    if (isNaN(tw) || tw < 4 || tw > 208) errors.timeframeWeeks = 'Enter 4-208 weeks';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      dreamJobTitle: dreamJobTitle.trim(),
      targetCompanyType: targetCompanyType.trim(),
      currentStage: currentStage.trim(),
      existingSkills,
      weeklyHours: parseInt(weeklyHours, 10),
      timeframeWeeks: parseInt(timeframeWeeks, 10),
      preferredLocation: preferredLocation.trim(),
      budgetPreference: budgetPreference.trim() || undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Career Roadmapper
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3">
          PathForge
        </h1>
        <p className="text-lg text-muted-foreground">
          Reverse-engineer your dream career into an interactive skill-tree graph.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 sm:p-8 shadow-2xl">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Try a sample profile:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => loadSample(sample.profile)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/60 hover:bg-secondary border border-border hover:border-primary/40 transition-colors text-secondary-foreground"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              icon={<Briefcase className="h-4 w-4" />}
              label="Dream Job Title"
              error={validationErrors.dreamJobTitle}
            >
              <Input
                value={dreamJobTitle}
                onChange={(e) => setDreamJobTitle(e.target.value)}
                placeholder="e.g., Full Stack Developer"
                aria-label="Dream job title"
              />
            </FormField>

            <FormField
              icon={<Building2 className="h-4 w-4" />}
              label="Target Company or Type"
              error={validationErrors.targetCompanyType}
            >
              <Input
                value={targetCompanyType}
                onChange={(e) => setTargetCompanyType(e.target.value)}
                placeholder="e.g., Climate-tech startup, Google"
                aria-label="Target company or type"
              />
            </FormField>
          </div>

          <FormField
            icon={<GraduationCap className="h-4 w-4" />}
            label="Current Education or Career Stage"
            error={validationErrors.currentStage}
          >
            <Input
              value={currentStage}
              onChange={(e) => setCurrentStage(e.target.value)}
              placeholder="e.g., CS student, 2nd year"
              aria-label="Current stage"
            />
          </FormField>

          <FormField
            icon={<Tags className="h-4 w-4" />}
            label="Existing Skills"
            description="Press Enter or comma to add a skill"
          >
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill and press Enter"
                aria-label="Add a skill"
                className="flex-1"
              />
              <Button type="button" variant="secondary" size="icon" onClick={addSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {existingSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {existingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-primary/70"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              icon={<Clock className="h-4 w-4" />}
              label="Weekly Hours Available"
              error={validationErrors.weeklyHours}
            >
              <Input
                type="number"
                min={1}
                max={80}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(e.target.value)}
                placeholder="e.g., 15"
                aria-label="Weekly hours available"
              />
            </FormField>

            <FormField
              icon={<CalendarDays className="h-4 w-4" />}
              label="Target Timeframe (weeks)"
              error={validationErrors.timeframeWeeks}
            >
              <Input
                type="number"
                min={4}
                max={208}
                value={timeframeWeeks}
                onChange={(e) => setTimeframeWeeks(e.target.value)}
                placeholder="e.g., 24"
                aria-label="Target timeframe in weeks"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              icon={<MapPin className="h-4 w-4" />}
              label="Preferred Location or Job Market"
              error={validationErrors.preferredLocation}
            >
              <Input
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                placeholder="e.g., Remote / San Francisco"
                aria-label="Preferred location"
              />
            </FormField>

            <FormField
              icon={<Wallet className="h-4 w-4" />}
              label="Budget Preference (optional)"
            >
              <Input
                value={budgetPreference}
                onChange={(e) => setBudgetPreference(e.target.value)}
                placeholder="e.g., Prefer free resources"
                aria-label="Budget preference"
              />
            </FormField>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full text-base font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Building Your Career Roadmap...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Build My Career Roadmap
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6 max-w-lg mx-auto">
        Career recommendations are AI-assisted suggestions and should be independently verified.
        PathForge does not guarantee job outcomes.
      </p>
    </motion.div>
  );
}

function FormField({
  icon,
  label,
  children,
  error,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  error?: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
