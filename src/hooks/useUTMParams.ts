import { useEffect, useState } from 'react';

export interface UTMParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  fbclid: string | null;
}

export const useUTMParams = (): UTMParams => {
  const [utmParams, setUtmParams] = useState<UTMParams>({
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    fbclid: null,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    const params: UTMParams = {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_content: urlParams.get('utm_content'),
      fbclid: urlParams.get('fbclid'),
    };
    
    // Store in sessionStorage for persistence across page navigations
    if (params.utm_source) sessionStorage.setItem('utm_source', params.utm_source);
    if (params.utm_medium) sessionStorage.setItem('utm_medium', params.utm_medium);
    if (params.utm_campaign) sessionStorage.setItem('utm_campaign', params.utm_campaign);
    if (params.utm_content) sessionStorage.setItem('utm_content', params.utm_content);
    if (params.fbclid) sessionStorage.setItem('fbclid', params.fbclid);
    
    // Retrieve from sessionStorage if not in URL
    setUtmParams({
      utm_source: params.utm_source || sessionStorage.getItem('utm_source'),
      utm_medium: params.utm_medium || sessionStorage.getItem('utm_medium'),
      utm_campaign: params.utm_campaign || sessionStorage.getItem('utm_campaign'),
      utm_content: params.utm_content || sessionStorage.getItem('utm_content'),
      fbclid: params.fbclid || sessionStorage.getItem('fbclid'),
    });
  }, []);

  return utmParams;
};

export const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

export const generateEventId = (prefix: string = 'lead'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
