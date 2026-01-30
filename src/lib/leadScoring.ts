import { differenceInMonths } from 'date-fns';

export interface LeadData {
  passport_ready: boolean;
  travel_month: Date | string | null;
  group_size: number;
  package_title?: string;
  budget_range: string;
}

export const calculateLeadScore = (lead: LeadData): number => {
  let score = 0;

  // +30 if passport ready
  if (lead.passport_ready) {
    score += 30;
  }

  // +20 if travel within 3 months
  if (lead.travel_month) {
    const travelDate = typeof lead.travel_month === 'string' 
      ? new Date(lead.travel_month) 
      : lead.travel_month;
    const monthsDiff = differenceInMonths(travelDate, new Date());
    if (monthsDiff >= 0 && monthsDiff <= 3) {
      score += 20;
    }
  }

  // +20 if group size > 2
  if (lead.group_size > 2) {
    score += 20;
  }

  // +20 if premium/VIP package selected
  if (lead.package_title) {
    const title = lead.package_title.toLowerCase();
    if (title.includes('premium') || title.includes('vip') || title.includes('deluxe')) {
      score += 20;
    }
  }

  // +10 if high budget
  if (lead.budget_range === '350K-500K' || lead.budget_range === '500K+') {
    score += 10;
  }

  return score;
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-emerald-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

export const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (score >= 60) return 'default';
  if (score >= 40) return 'secondary';
  if (score >= 20) return 'outline';
  return 'destructive';
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'New':
      return 'bg-blue-500';
    case 'Contacted':
      return 'bg-yellow-500';
    case 'Converted':
      return 'bg-green-500';
    case 'Lost':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'New':
      return 'outline';
    case 'Contacted':
      return 'secondary';
    case 'Converted':
      return 'default';
    case 'Lost':
      return 'destructive';
    default:
      return 'outline';
  }
};
