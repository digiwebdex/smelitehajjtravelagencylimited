import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUTMParams, getDeviceType, generateEventId } from './useUTMParams';
import { calculateLeadScore } from '@/lib/leadScoring';
import { useFacebookPixel } from './useFacebookPixel';
import { useToast } from '@/hooks/use-toast';

export interface LeadFormData {
  name: string;
  phone: string;
  email?: string;
  package_id?: string;
  package_title?: string;
  travel_month?: Date | null;
  budget_range?: string;
  passport_ready?: boolean;
  group_size?: number;
  message?: string;
  honeypot?: string; // spam protection
}

interface UseLeadCaptureReturn {
  submitLead: (data: LeadFormData) => Promise<{ success: boolean; leadId?: string; error?: string }>;
  isSubmitting: boolean;
}

export const useLeadCapture = (): UseLeadCaptureReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utmParams = useUTMParams();
  const { trackLead } = useFacebookPixel();
  const { toast } = useToast();

  const submitLead = async (data: LeadFormData): Promise<{ success: boolean; leadId?: string; error?: string }> => {
    // Honeypot check - if filled, silently reject
    if (data.honeypot && data.honeypot.trim() !== '') {
      console.log('Spam detected via honeypot');
      // Pretend success to confuse bots
      return { success: true, leadId: 'blocked' };
    }

    setIsSubmitting(true);

    try {
      // Calculate lead score
      const leadScore = calculateLeadScore({
        passport_ready: data.passport_ready || false,
        travel_month: data.travel_month || null,
        group_size: data.group_size || 1,
        package_title: data.package_title,
        budget_range: data.budget_range || '',
      });

      // Generate event ID for Facebook tracking
      const eventId = generateEventId('lead');

      // Prepare lead data
      const leadData = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        package_id: data.package_id || null,
        travel_month: data.travel_month ? data.travel_month.toISOString().split('T')[0] : null,
        budget_range: data.budget_range || null,
        passport_ready: data.passport_ready || false,
        group_size: data.group_size || 1,
        message: data.message?.trim() || null,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_content: utmParams.utm_content,
        fbclid: utmParams.fbclid,
        device_type: getDeviceType(),
        user_agent: navigator.userAgent,
        lead_score: leadScore,
        lead_status: 'New' as const,
        original_event_id: eventId,
      };

      // Insert lead into database
      const { data: insertedLead, error: insertError } = await supabase
        .from('leads')
        .insert(leadData)
        .select('id')
        .single();

      if (insertError) {
        console.error('Error inserting lead:', insertError);
        throw new Error(insertError.message);
      }

      // Track Lead event via Facebook Pixel
      await trackLead({
        value: 50000, // Default lead value (can be configured)
        contentName: data.package_title || 'Lead Form Submission',
        userData: {
          email: data.email,
          phone: data.phone,
        },
      });

      toast({
        title: "✅ Thank you for your interest!",
        description: "Our team will contact you shortly.",
      });

      return { success: true, leadId: insertedLead.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit lead';
      console.error('Lead submission error:', error);
      
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitLead, isSubmitting };
};
