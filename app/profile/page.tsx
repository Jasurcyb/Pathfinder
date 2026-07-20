'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { defaultUserProfile } from '@/lib/mock-data';
import { UserProfile } from '@/types';
import { useLanguage, type Locale } from '@/lib/language-context';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbek",
};

export default function ProfilePage() {
  const { t, locale, setLocale } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  // Load profile from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.log('[v0] Failed to load profile from localStorage');
      }
    }
  }, []);

  const handleSaveProfile = () => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setIsEditing(false);
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const handleAddInterest = () => {
    if (interestInput.trim() && !profile.interests.includes(interestInput.trim())) {
      setProfile(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()],
      }));
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest),
    }));
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            PathFinder
          </Link>
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1 py-0.5">
              {(Object.keys(LOCALE_LABELS) as Locale[]).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    locale === loc
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              {t('navDashboard')}
            </Link>
            <Link
              href="/agents"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              {t('navDebate')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground">{t('userProfile')}</h1>
            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveProfile();
                } else {
                  setIsEditing(true);
                }
              }}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              {isEditing ? t('saveProfile') : t('editProfile')}
            </button>
          </div>
          <p className="text-foreground/70">{t('profileSubtitle')}</p>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('personalInfo')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">{t('profileName')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="text-foreground">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">{t('profileUniversity')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.university}
                      onChange={e => setProfile({ ...profile, university: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="text-foreground">{profile.university}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">{t('profileField')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.fieldOfStudy}
                      onChange={e => setProfile({ ...profile, fieldOfStudy: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="text-foreground">{profile.fieldOfStudy}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">{t('profileGradYear')}</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profile.graduationYear}
                      onChange={e => setProfile({ ...profile, graduationYear: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="text-foreground">{profile.graduationYear}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">{t('profileGpa')}</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={profile.gpa}
                      onChange={e => setProfile({ ...profile, gpa: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <p className="text-foreground">{profile.gpa.toFixed(2)} / 4.0</p>
                  )}
                </div>
              </div>
            </div>

            {/* English Level */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('profileEnglish')}</h2>
              {isEditing ? (
                <select
                  value={profile.englishLevel}
                  onChange={e => setProfile({ ...profile, englishLevel: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                >
                  <option>Pre-IELTS</option>
                  <option>A2</option>
                  <option>B1</option>
                  <option>B2</option>
                  <option>C1</option>
                  <option>C2</option>
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">{profile.englishLevel}</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.englishLevel === 'Pre-IELTS' && t('levelBeginner')}
                    {profile.englishLevel === 'A2' && t('levelElementary')}
                    {profile.englishLevel === 'B1' && t('levelIntermediate')}
                    {profile.englishLevel === 'B2' && t('levelUpperIntermediate')}
                    {profile.englishLevel === 'C1' && t('levelAdvanced')}
                    {profile.englishLevel === 'C2' && t('levelFluent')}
                  </span>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('profileSkills')}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills.map(skill => (
                  <div key={skill} className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center gap-2 border border-primary/30">
                    {skill}
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-primary/60 hover:text-primary ml-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddSkill()}
                    placeholder={t('enterSkill')}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-3 py-2 rounded-lg bg-primary/20 text-primary font-medium hover:bg-primary/30 transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Interests */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('profileInterests')}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.interests.map(interest => (
                  <div key={interest} className="px-3 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium flex items-center gap-2 border border-accent/30">
                    {interest}
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveInterest(interest)}
                        className="text-accent/60 hover:text-accent ml-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={e => setInterestInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddInterest()}
                    placeholder={t('enterInterest')}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
                  />
                  <button
                    onClick={handleAddInterest}
                    className="px-3 py-2 rounded-lg bg-accent/20 text-accent font-medium hover:bg-accent/30 transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-3">{t('profileSummary')}</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('fullName')}</span>
                    <p className="text-foreground font-medium">{profile.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('gpaLabel')}</span>
                    <p className="text-foreground font-medium">{profile.gpa.toFixed(2)} / 4.0</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('englishLabel')}</span>
                    <p className="text-foreground font-medium">{profile.englishLevel}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('skillsCount')}</span>
                    <p className="text-foreground font-medium">{profile.skills.length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('interestsCount')}</span>
                    <p className="text-foreground font-medium">{profile.interests.length}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-3">{t('tips')}</h3>
                <ul className="space-y-2 text-xs text-foreground/70">
                  <li>• {t('tip1')}</li>
                  <li>• {t('tip2')}</li>
                  <li>• {t('tip3')}</li>
                  <li>• {t('tip4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
