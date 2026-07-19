import { Opportunity, AgentMessage, UserProfile } from '@/types';

export const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'KAUST VSRP',
    organization: 'King Abdullah University of Science and Technology',
    category: 'research',
    deadline: '2027-03-31',
    matchScore: 95,
    description:
      'KAUST Visiting Student Research Program - Advanced AI and cybersecurity research opportunity with top researchers.',
    requirements:
      'Bachelor degree in Computer Science or related field, minimum GPA 3.5, English proficiency B2+, research experience preferred',
    translatedRequirements:
      'Степень бакалавра в области компьютерных наук, минимальный GPA 3.5, владение английским языком B2+, опыт исследований приветствуется',
    draftApplication: `Уважаемые члены комиссии,

Я am deeply interested in joining KAUST VSRP program to advance my research in AI and cybersecurity.

My background includes:
- Strong foundation in machine learning and deep learning
- Python proficiency with experience in TensorFlow and PyTorch
- Published research on network security

I am committed to leveraging this opportunity to contribute to the cutting-edge research at KAUST.

Sincerely,
[Your Name]`,
    status: 'matched',
    location: 'Saudi Arabia',
  },
  {
    id: '2',
    title: 'DAAD Scholarship',
    organization: 'German Academic Exchange Service',
    category: 'scholarship',
    deadline: '2026-10-31',
    matchScore: 88,
    description:
      'Full scholarship for Master studies in Germany with monthly allowance and health insurance coverage.',
    requirements:
      'Bachelor degree, B1 German or English proficiency, strong academic record, motivation letter',
    translatedRequirements:
      'Степень бакалавра, уровень немецкого или английского B1+, сильная академическая успеваемость, мотивационное письмо',
    draftApplication: `Уважаемые члены комиссии DAAD,

I am applying for the DAAD Scholarship to pursue my Master studies in Germany.

Education:
- Bachelor of Science in Computer Science
- Current GPA: 3.8/4.0
- Specialization: AI and Cybersecurity

Career Goals:
- Advance technical expertise in AI systems
- Contribute to global cybersecurity challenges
- Build international professional network

I believe DAAD scholarship will enable me to achieve these goals.

Best regards,
[Your Name]`,
    status: 'matched',
    location: 'Germany',
  },
  {
    id: '3',
    title: 'OpenAI Open Source Program',
    organization: 'OpenAI',
    category: 'grant',
    deadline: 'Rolling admissions',
    matchScore: 82,
    description:
      'Ongoing program supporting open source AI development, providing API credits and resources for researchers and developers building open source AI tools.',
    requirements:
      'Active open-source contributor, clear project proposal, alignment with OpenAI safety guidelines',
    translatedRequirements:
      'Активный участник проектов с открытым исходным кодом, четкое предложение проекта, соответствие рекомендациям OpenAI по безопасности',
    draftApplication: `Dear OpenAI Open Source Team,

I am writing to propose a project for the OpenAI Open Source Program.

Project Title: OpenSource AI Threat Detector
Description: A developer tool that analyzes pull requests for potential security issues and credential leaks using OpenAI models.

Alignment:
- Zero cost for developers via open source model deployment.
- High developer utility.

We request API credits to support our testing and development cycles.

Best regards,
[Your Name]`,
    status: 'discovered',
    location: 'Online',
  },
  {
    id: '4',
    title: 'Erasmus Mundus CYBERMACS',
    organization: 'European Commission',
    category: 'scholarship',
    deadline: '2027-01-31',
    matchScore: 85,
    description:
      'Master program in Cyber Security in the EU with full scholarship and internship opportunities.',
    requirements:
      'Bachelor degree, English proficiency B2, GPA 3.0+, motivation letter, 2 references',
    translatedRequirements:
      'Степень бакалавра, английский B2+, GPA 3.0+, мотивационное письмо, 2 рекомендации',
    draftApplication: `Application for Erasmus Mundus CYBERMACS Program

Applicant: [Your Name]

Academic Background:
- BSc in Computer Science
- GPA: 3.7/4.0
- Relevant Coursework: Cybersecurity, Cryptography, Network Security

Motivation:
The CYBERMACS program aligns perfectly with my career goal of becoming a cybersecurity specialist.
I am particularly interested in the program's focus on both theoretical foundations and practical applications.

Language Skills:
- English: B2 certified (IELTS 7.0)
- Russian: Native
- Additional: Basic German

Commitment:
I am fully committed to completing the program and contributing to the EU cybersecurity community.`,
    status: 'matched',
    location: 'EU',
  },
  {
    id: '5',
    title: 'Google Build with Gemini XPRIZE',
    organization: 'XPRIZE Foundation / Google',
    category: 'competition',
    deadline: 'Multi-month build window',
    matchScore: 85,
    description:
      'Build real products using Gemini AI across 5 categories: Education, Entrepreneurship, Small Business Services, Financial Access, Professional Services.',
    requirements:
      'Registration on XPRIZE portal, prototype built with Gemini API, team submission',
    translatedRequirements:
      'Регистрация на портале XPRIZE, прототип на базе Gemini API, командная заявка',
    draftApplication: `Google Build with Gemini XPRIZE Project Proposal: EdTech Tutor

Project Overview:
An AI-powered tutor built with Gemini API that adapts to students' learning speed in science.

Track: Education
Gemini Integration: Using Gemini Flash for real-time explanations and Gemini Pro for complex grading.

Impact:
Free, personalized education for students in developing regions.

Timeline: Develop working MVP in 4 weeks, user testing in 2 weeks.`,
    status: 'discovered',
    location: 'Global',
  },
  {
    id: '6',
    title: 'Microsoft AI for Good Lab',
    organization: 'Microsoft',
    category: 'grant',
    deadline: 'Rolling admissions',
    matchScore: 78,
    description:
      'Ongoing grant and mentorship program for AI projects addressing humanitarian and social good challenges.',
    requirements:
      'Project focusing on sustainability, accessibility, humanitarian action, or health, technical viability check',
    translatedRequirements:
      'Проект, ориентированный на устойчивое развитие, доступность, гуманитарную помощь или здравоохранение, техническая осуществимость',
    draftApplication: `Microsoft AI for Good Proposal: GreenTech Optimizer

Concept:
An AI system powered by Azure Machine Learning to optimize energy usage in public schools.

Social Good Focus: Sustainability
We request Microsoft Azure credits and technical mentorship to scale our existing prototype.

Best regards,
[Your Name]`,
    status: 'matched',
    location: 'Global',
  },
  {
    id: '7',
    title: 'Fulbright Program',
    organization: 'U.S. State Department',
    category: 'scholarship',
    deadline: '2026-10-15',
    matchScore: 70,
    description:
      'Prestigious scholarship for graduate studies in the United States with additional benefits.',
    requirements:
      'Bachelor degree, excellent English (TOEFL 100+), strong GPA, interview required',
    translatedRequirements:
      'Степень бакалавра, отличный английский (TOEFL 100+), высокий GPA, требуется интервью',
    draftApplication: `Fulbright Scholarship Application

Personal Statement:
I am an ambitious computer science graduate seeking to advance my skills in AI research at a leading U.S. institution.

Academic Excellence:
- GPA: 3.9/4.0
- Awards: Dean's List (3 consecutive years)
- TOEFL: 105

Research Interests:
- Artificial Intelligence
- Cybersecurity
- Sustainable Computing

Long-term Vision:
Upon return, I aim to establish a research center focusing on AI applications for social good in Central Asia.`,
    status: 'discovered',
    location: 'USA',
  },
  {
    id: '8',
    title: 'Google Summer of Code',
    organization: 'Google',
    category: 'grant',
    deadline: '2027-03-31',
    matchScore: 82,
    description:
      'Summer internship program working on open-source projects with mentorship from industry experts.',
    requirements:
      'Currently enrolled student, programming experience, familiarity with open-source',
    translatedRequirements:
      'Текущий студент, опыт программирования, знакомство с открытым исходным кодом',
    draftApplication: `Google Summer of Code Application

Project: Advanced Threat Detection Module for Kubernetes Security

Motivation:
I am passionate about open-source development and cybersecurity. This project combines both interests perfectly.

Experience:
- 2+ years with Python and Go
- Active in open-source community (contributed to 3 projects)
- Led development of security-focused tools

Proposed Work:
Implement ML-based anomaly detection for Kubernetes clusters with comprehensive testing and documentation.

Timeline:
Week 1-2: Environment setup and codebase familiarization
Week 3-6: Core ML model implementation
Week 7-10: Integration and testing
Week 11-12: Documentation and optimization`,
    status: 'discovered',
    location: 'Global',
  },
];

export const mockAgentMessages: AgentMessage[] = [
  {
    id: '1',
    agent: 'scout',
    message: 'Сканирование завершено. Найдено 47 возможностей, соответствующих AI, кибербезопасности и интересам в Центральной Азии.',
    timestamp: '2026-07-05T10:00:00Z',
  },
  {
    id: '2',
    agent: 'matcher',
    message: 'Анализ профиля пользователя: GPA 3.8, уровень английского Pre-IELTS, 4 года до выпуска. Отфильтровано 12 возможностей с совпадением выше 70%.',
    timestamp: '2026-07-05T10:05:00Z',
  },
  {
    id: '3',
    agent: 'negotiator',
    message: 'KAUST VSRP имеет высокую релевантность (95), но требует английский B2+ и опыт исследований. Пользователь сейчас Pre-IELTS. Риск: высокие требования.',
    timestamp: '2026-07-05T10:10:00Z',
  },
  {
    id: '4',
    agent: 'translator',
    message: 'Требования KAUST упрощены на русском: нужна степень бакалавра, GPA 3.5+, английский B2, опыт в исследованиях приветствуется.',
    timestamp: '2026-07-05T10:12:00Z',
  },
  {
    id: '5',
    agent: 'writer',
    message: 'OpenAI Open Source Program требует меньше языковой сложности, выше вероятность успеха. DAAD и Microsoft AI for Good Lab также хорошие краткосрочные цели.',
    timestamp: '2026-07-05T10:15:00Z',
  },
  {
    id: '6',
    agent: 'negotiator',
    message: 'КОНСЕНСУС: Приоритет - OpenAI Program (готовность 100%), Microsoft Lab (готовность 95%). DAAD подготовка параллельно. KAUST отложить на 2027, когда английский B2.',
    timestamp: '2026-07-05T10:18:00Z',
  },
];

export const defaultUserProfile: UserProfile = {
  name: 'Ибрагим Исмаилов',
  university: 'Ташкентский государственный технический университет',
  fieldOfStudy: 'Компьютерные науки',
  graduationYear: 2028,
  skills: ['AI', 'Cybersecurity', 'Python', 'Machine Learning', 'Kubernetes'],
  englishLevel: 'Pre-IELTS',
  gpa: 3.8,
  interests: ['AI Research', 'Cybersecurity', 'Open Source', 'Cloud Computing'],
};

export function getOpportunityById(id: string): Opportunity | undefined {
  return mockOpportunities.find(opp => opp.id === id);
}

export function filterOpportunities(category?: string): Opportunity[] {
  if (!category || category === 'all') return mockOpportunities;
  return mockOpportunities.filter(opp => opp.category === category);
}

export function calculateStats() {
  const total = mockOpportunities.length;
  const matched = mockOpportunities.filter(opp => opp.matchScore >= 70).length;
  const applied = mockOpportunities.filter(opp => opp.status === 'applied').length;
  const successRate = applied > 0 ? Math.round((applied / matched) * 100) : 0;

  return { total, matched, applied, successRate };
}
