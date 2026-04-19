// Curated calendar of awareness days/months relevant to nonprofits.
// Used to inspire campaign creation. Dates that vary year-to-year are computed.

export interface AwarenessEvent {
  key: string;
  name: string;
  category: 'health' | 'social' | 'environment' | 'youth' | 'arts' | 'animals' | 'giving' | 'global';
  scope: 'day' | 'week' | 'month';
  // For fixed dates: month (1-12) + day. For months: month only.
  month: number;
  day?: number;
  // Optional dynamic resolver for movable observances (returns Date for given year)
  resolve?: (year: number) => Date;
  description: string;
  color: string; // hex for the card accent
}

// Helper: nth weekday of a month (n=1..5, weekday 0=Sun..6=Sat)
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month - 1, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month - 1, 1 + offset + (n - 1) * 7);
}

// Tuesday after US Thanksgiving (4th Thursday of November + 5 days)
function givingTuesday(year: number): Date {
  const thanksgiving = nthWeekday(year, 11, 4, 4);
  const gt = new Date(thanksgiving);
  gt.setDate(thanksgiving.getDate() + 5);
  return gt;
}

export const AWARENESS_EVENTS: AwarenessEvent[] = [
  // JANUARY
  { key: 'mentoring_month', name: 'National Mentoring Month', category: 'youth', scope: 'month', month: 1, description: 'Spotlight youth mentorship programs and recruit new mentors.', color: '#f59e0b' },
  { key: 'mlk_day', name: 'MLK Day of Service', category: 'social', scope: 'day', month: 1, resolve: (y) => nthWeekday(y, 1, 1, 3), description: 'Day of service honoring Dr. King. Mobilize volunteers for community projects.', color: '#1e40af' },
  { key: 'human_trafficking_month', name: 'Human Trafficking Awareness Month', category: 'social', scope: 'month', month: 1, description: 'Educate your community about modern slavery prevention.', color: '#7c3aed' },

  // FEBRUARY
  { key: 'black_history_month', name: 'Black History Month', category: 'social', scope: 'month', month: 2, description: 'Celebrate Black achievement and fund equity-focused programs.', color: '#dc2626' },
  { key: 'random_acts_kindness', name: 'Random Acts of Kindness Day', category: 'social', scope: 'day', month: 2, day: 17, description: 'Inspire micro-giving and community-care stories.', color: '#ec4899' },
  { key: 'heart_month', name: 'American Heart Month', category: 'health', scope: 'month', month: 2, description: 'Heart-health awareness — perfect for healthcare nonprofits.', color: '#dc2626' },

  // MARCH
  { key: 'womens_history_month', name: "Women's History Month", category: 'social', scope: 'month', month: 3, description: 'Highlight women leaders, fund women-focused programs.', color: '#a855f7' },
  { key: 'world_water_day', name: 'World Water Day', category: 'environment', scope: 'day', month: 3, day: 22, description: 'Clean-water access campaigns — strong for global aid orgs.', color: '#0ea5e9' },
  { key: 'social_work_month', name: 'Social Work Month', category: 'social', scope: 'month', month: 3, description: 'Honor social workers and the communities they serve.', color: '#0891b2' },

  // APRIL
  { key: 'volunteer_month', name: 'National Volunteer Month', category: 'social', scope: 'month', month: 4, description: 'Recruit and recognize volunteers — peak season for engagement.', color: '#16a34a' },
  { key: 'earth_day', name: 'Earth Day', category: 'environment', scope: 'day', month: 4, day: 22, description: 'Environmental fundraising and education campaigns.', color: '#16a34a' },
  { key: 'autism_month', name: 'Autism Acceptance Month', category: 'health', scope: 'month', month: 4, description: 'Build awareness and fund support services.', color: '#3b82f6' },
  { key: 'child_abuse_month', name: 'Child Abuse Prevention Month', category: 'youth', scope: 'month', month: 4, description: 'Wear blue, share resources, fund prevention programs.', color: '#1d4ed8' },

  // MAY
  { key: 'mental_health_month', name: 'Mental Health Awareness Month', category: 'health', scope: 'month', month: 5, description: 'Reduce stigma and fund mental-health services.', color: '#10b981' },
  { key: 'aapi_month', name: 'AAPI Heritage Month', category: 'social', scope: 'month', month: 5, description: 'Celebrate Asian American & Pacific Islander communities.', color: '#f97316' },
  { key: 'foster_care_month', name: 'National Foster Care Month', category: 'youth', scope: 'month', month: 5, description: 'Recruit foster families and fund youth services.', color: '#8b5cf6' },
  { key: 'mothers_day', name: "Mother's Day", category: 'giving', scope: 'day', month: 5, resolve: (y) => nthWeekday(y, 5, 0, 2), description: 'Tribute giving in honor of mothers.', color: '#ec4899' },

  // JUNE
  { key: 'pride_month', name: 'Pride Month', category: 'social', scope: 'month', month: 6, description: 'Celebrate LGBTQ+ communities and fund equity work.', color: '#db2777' },
  { key: 'world_refugee_day', name: 'World Refugee Day', category: 'global', scope: 'day', month: 6, day: 20, description: 'Support refugee and asylum-seeker programs.', color: '#0284c7' },
  { key: 'fathers_day', name: "Father's Day", category: 'giving', scope: 'day', month: 6, resolve: (y) => nthWeekday(y, 6, 0, 3), description: 'Tribute giving in honor of fathers.', color: '#0369a1' },

  // JULY
  { key: 'disability_pride_month', name: 'Disability Pride Month', category: 'social', scope: 'month', month: 7, description: 'Center disability advocacy and accessible programming.', color: '#7c3aed' },
  { key: 'world_population_day', name: 'World Population Day', category: 'global', scope: 'day', month: 7, day: 11, description: 'Global health, family planning, and education campaigns.', color: '#0891b2' },

  // AUGUST
  { key: 'back_to_school', name: 'Back-to-School Season', category: 'youth', scope: 'month', month: 8, description: 'School supply drives, scholarship campaigns, education funding.', color: '#f59e0b' },
  { key: 'world_humanitarian_day', name: 'World Humanitarian Day', category: 'global', scope: 'day', month: 8, day: 19, description: 'Honor aid workers and fund humanitarian relief.', color: '#dc2626' },

  // SEPTEMBER
  { key: 'hunger_action_month', name: 'Hunger Action Month', category: 'social', scope: 'month', month: 9, description: 'Food bank drives and hunger-relief fundraising.', color: '#ea580c' },
  { key: 'suicide_prevention_month', name: 'Suicide Prevention Awareness Month', category: 'health', scope: 'month', month: 9, description: 'Mental health awareness and crisis-line support.', color: '#facc15' },
  { key: 'childhood_cancer_month', name: 'Childhood Cancer Awareness Month', category: 'health', scope: 'month', month: 9, description: 'Wear gold and fund pediatric cancer research.', color: '#ca8a04' },
  { key: '911_day_of_service', name: '9/11 National Day of Service', category: 'social', scope: 'day', month: 9, day: 11, description: 'Volunteer mobilization in remembrance.', color: '#1e3a8a' },

  // OCTOBER
  { key: 'breast_cancer_month', name: 'Breast Cancer Awareness Month', category: 'health', scope: 'month', month: 10, description: 'Pink campaigns, screenings, and research funding.', color: '#ec4899' },
  { key: 'domestic_violence_month', name: 'Domestic Violence Awareness Month', category: 'social', scope: 'month', month: 10, description: 'Purple campaigns supporting survivors.', color: '#7e22ce' },
  { key: 'world_food_day', name: 'World Food Day', category: 'global', scope: 'day', month: 10, day: 16, description: 'Global hunger awareness and food-security funding.', color: '#65a30d' },
  { key: 'world_mental_health_day', name: 'World Mental Health Day', category: 'health', scope: 'day', month: 10, day: 10, description: 'Global mental-health advocacy day.', color: '#10b981' },

  // NOVEMBER
  { key: 'native_heritage_month', name: 'Native American Heritage Month', category: 'social', scope: 'month', month: 11, description: 'Honor Indigenous communities and fund tribal programs.', color: '#b45309' },
  { key: 'veterans_day', name: 'Veterans Day', category: 'social', scope: 'day', month: 11, day: 11, description: 'Veteran services, housing, and mental-health support.', color: '#1e40af' },
  { key: 'giving_tuesday', name: 'Giving Tuesday', category: 'giving', scope: 'day', month: 11, resolve: givingTuesday, description: 'The biggest giving day of the year. Full template available.', color: '#dc2626' },

  // DECEMBER
  { key: 'world_aids_day', name: 'World AIDS Day', category: 'health', scope: 'day', month: 12, day: 1, description: 'HIV/AIDS awareness, prevention, and care funding.', color: '#dc2626' },
  { key: 'human_rights_day', name: 'Human Rights Day', category: 'global', scope: 'day', month: 12, day: 10, description: 'Civil and human rights advocacy fundraising.', color: '#2563eb' },
  { key: 'year_end_giving', name: 'Year-End Giving Push', category: 'giving', scope: 'month', month: 12, day: 31, description: 'Tax-deductible deadline campaign — typically 30-40% of annual giving.', color: '#059669' },
];

// Get the next occurrence of an event from today
export function getNextOccurrence(event: AwarenessEvent, fromDate: Date = new Date()): Date {
  const year = fromDate.getFullYear();
  const candidate = (y: number): Date => {
    if (event.resolve) return event.resolve(y);
    return new Date(y, event.month - 1, event.day || 1);
  };
  let d = candidate(year);
  if (d < fromDate) d = candidate(year + 1);
  return d;
}

export function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}
