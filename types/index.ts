export type OpportunityCategory = 'grant' | 'hackathon' | 'scholarship' | 'research' | 'competition';
export type AgentType = 'scout' | 'matcher' | 'translator' | 'writer' | 'negotiator';
export type EnglishLevel = 'Pre-IELTS' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  deadline: string;
  matchScore: number;
  description: string;
  requirements: string;
  translatedRequirements: string;
  draftApplication: string;
  status: 'discovered' | 'matched' | 'drafted' | 'applied';
  location: string;
  imageUrl?: string;
}

export interface AgentMessage {
  id: string;
  agent: AgentType;
  model?: string;
  message: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  university: string;
  fieldOfStudy: string;
  graduationYear: number;
  skills: string[];
  englishLevel: EnglishLevel;
  gpa: number;
  interests: string[];
}

export interface DebateState {
  messages: AgentMessage[];
  isRunning: boolean;
}
