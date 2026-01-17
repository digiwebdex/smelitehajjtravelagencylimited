import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'bn' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'nav.home': 'Home',
    'nav.hajj': 'Hajj Packages',
    'nav.umrah': 'Umrah Packages',
    'nav.services': 'Services',
    'nav.visa': 'Visa Services',
    'nav.about': 'About Us',
    'nav.contact': 'Contact',
    'nav.bookNow': 'Book Now',
    'nav.login': 'Login',
    'nav.myBookings': 'My Bookings',
    'nav.adminDashboard': 'Admin Dashboard',
    'nav.signOut': 'Sign Out',
    
    // Hero Section
    'hero.badge': 'Government Approved Hajj & Umrah Agency',
    'hero.title': 'Your Sacred Journey Begins Here',
    'hero.subtitle': 'Experience the pilgrimage of a lifetime',
    'hero.description': 'We provide comprehensive Hajj and Umrah packages with premium accommodation, expert guidance, and complete care throughout your spiritual journey.',
    'hero.explorePackages': 'Explore Packages',
    'hero.watchVideo': 'Watch Video',
    'hero.yearsExperience': 'Years Experience',
    'hero.happyPilgrims': 'Happy Pilgrims',
    'hero.successRate': 'Success Rate',
    
    // Services
    'services.title': 'Complete Hajj & Umrah Services',
    'services.subtitle': 'Why Choose Us',
    'services.flightBooking': 'Flight Booking',
    'services.flightDesc': 'Premium airlines with comfortable travel arrangements to Saudi Arabia',
    'services.hotelAccommodation': 'Hotel Accommodation',
    'services.hotelDesc': 'Hand-picked hotels near Haram for convenient access to worship',
    'services.visaProcessing': 'Visa Processing',
    'services.visaDesc': '100% success rate in Hajj & Umrah visa processing',
    'services.expertGuides': 'Expert Guides',
    'services.guidesDesc': 'Experienced Islamic scholars to guide you through rituals',
    'services.support': '24/7 Support',
    'services.supportDesc': 'Round-the-clock assistance throughout your spiritual journey',
    'services.completeCare': 'Complete Care',
    'services.careDesc': 'From departure to return, we handle every detail with care',
    
    // Packages
    'packages.hajj': 'Hajj Packages',
    'packages.umrah': 'Umrah Packages',
    'packages.hajjArabic': 'حَجّ',
    'packages.umrahArabic': 'عُمْرَة',
    'packages.hajjDesc': 'Fulfill the fifth pillar of Islam with our carefully designed Hajj packages. We ensure a spiritually enriching and comfortable experience for every pilgrim.',
    'packages.umrahDesc': 'Embark on your spiritual journey with our exclusive Umrah packages. We provide premium accommodation, transportation, and guidance.',
    'packages.bookNow': 'Book This Package',
    'packages.mostPopular': 'Most Popular Choice',
    'packages.perPerson': 'per person',
    'packages.showMore': 'Show More',
    'packages.showLess': 'Show Less',
    
    // Visa
    'visa.title': 'Visa Services',
    'visa.subtitle': 'Hassle-Free Visa Processing',
    'visa.description': 'We offer comprehensive visa processing services for multiple countries with high success rates.',
    'visa.processingTime': 'Processing Time',
    'visa.applyNow': 'Apply Now',
    'visa.viewAll': 'View All Countries',
    
    // Testimonials
    'testimonials.title': 'Pilgrim Testimonials',
    'testimonials.subtitle': 'What Our Pilgrims Say',
    
    // Team
    'team.title': 'Our Team',
    'team.subtitle': 'Meet Our Team',
    'team.managementBoard': 'Management Board',
    'team.shariahBoard': 'Shariah Board',
    
    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.subtitle': 'Have Questions?',
    
    // Contact
    'contact.title': 'Contact Us',
    'contact.subtitle': 'Get In Touch',
    'contact.description': 'Have questions about our Hajj or Umrah packages? We\'re here to help you plan your sacred journey.',
    'contact.sendMessage': 'Send us a Message',
    'contact.fullName': 'Full Name',
    'contact.email': 'Email Address',
    'contact.phone': 'Phone Number',
    'contact.message': 'Your Message',
    'contact.send': 'Send Message',
    'contact.sending': 'Sending...',
    'contact.offices': 'Our Offices',
    
    // Footer
    'footer.quickLinks': 'Quick Links',
    'footer.services': 'Services',
    'footer.contact': 'Contact Us',
    'footer.followUs': 'Follow Us',
    'footer.rights': 'All rights reserved',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.close': 'Close',
  },
  bn: {
    // Header
    'nav.home': 'হোম',
    'nav.hajj': 'হজ্জ প্যাকেজ',
    'nav.umrah': 'উমরাহ প্যাকেজ',
    'nav.services': 'সেবাসমূহ',
    'nav.visa': 'ভিসা সেবা',
    'nav.about': 'আমাদের সম্পর্কে',
    'nav.contact': 'যোগাযোগ',
    'nav.bookNow': 'বুক করুন',
    'nav.login': 'লগইন',
    'nav.myBookings': 'আমার বুকিং',
    'nav.adminDashboard': 'অ্যাডমিন ড্যাশবোর্ড',
    'nav.signOut': 'সাইন আউট',
    
    // Hero Section
    'hero.badge': 'সরকার অনুমোদিত হজ্জ ও উমরাহ এজেন্সি',
    'hero.title': 'আপনার পবিত্র যাত্রা এখান থেকে শুরু',
    'hero.subtitle': 'জীবনের সেরা তীর্থযাত্রার অভিজ্ঞতা নিন',
    'hero.description': 'আমরা আপনার আধ্যাত্মিক যাত্রায় প্রিমিয়াম আবাসন, বিশেষজ্ঞ গাইডেন্স এবং সম্পূর্ণ যত্নসহ ব্যাপক হজ্জ ও উমরাহ প্যাকেজ প্রদান করি।',
    'hero.explorePackages': 'প্যাকেজ দেখুন',
    'hero.watchVideo': 'ভিডিও দেখুন',
    'hero.yearsExperience': 'বছরের অভিজ্ঞতা',
    'hero.happyPilgrims': 'সন্তুষ্ট তীর্থযাত্রী',
    'hero.successRate': 'সাফল্যের হার',
    
    // Services
    'services.title': 'সম্পূর্ণ হজ্জ ও উমরাহ সেবা',
    'services.subtitle': 'কেন আমাদের বেছে নেবেন',
    'services.flightBooking': 'ফ্লাইট বুকিং',
    'services.flightDesc': 'সৌদি আরবে আরামদায়ক ভ্রমণ ব্যবস্থা সহ প্রিমিয়াম এয়ারলাইন্স',
    'services.hotelAccommodation': 'হোটেল আবাসন',
    'services.hotelDesc': 'ইবাদতের সুবিধার্থে হারামের কাছে নির্বাচিত হোটেল',
    'services.visaProcessing': 'ভিসা প্রসেসিং',
    'services.visaDesc': 'হজ্জ ও উমরাহ ভিসা প্রসেসিংয়ে ১০০% সাফল্যের হার',
    'services.expertGuides': 'বিশেষজ্ঞ গাইড',
    'services.guidesDesc': 'আচার-অনুষ্ঠানে আপনাকে গাইড করতে অভিজ্ঞ ইসলামিক পণ্ডিত',
    'services.support': '২৪/৭ সহায়তা',
    'services.supportDesc': 'আপনার আধ্যাত্মিক যাত্রায় সার্বক্ষণিক সহায়তা',
    'services.completeCare': 'সম্পূর্ণ যত্ন',
    'services.careDesc': 'যাত্রা শুরু থেকে ফেরা পর্যন্ত প্রতিটি বিষয় আমরা যত্ন সহকারে পরিচালনা করি',
    
    // Packages
    'packages.hajj': 'হজ্জ প্যাকেজ',
    'packages.umrah': 'উমরাহ প্যাকেজ',
    'packages.hajjArabic': 'حَجّ',
    'packages.umrahArabic': 'عُمْرَة',
    'packages.hajjDesc': 'আমাদের সুপরিকল্পিত হজ্জ প্যাকেজের মাধ্যমে ইসলামের পঞ্চম স্তম্ভ পালন করুন। আমরা প্রতিটি তীর্থযাত্রীর জন্য আধ্যাত্মিকভাবে সমৃদ্ধ এবং আরামদায়ক অভিজ্ঞতা নিশ্চিত করি।',
    'packages.umrahDesc': 'আমাদের এক্সক্লুসিভ উমরাহ প্যাকেজের মাধ্যমে আপনার আধ্যাত্মিক যাত্রা শুরু করুন। আমরা প্রিমিয়াম আবাসন, পরিবহন এবং গাইডেন্স প্রদান করি।',
    'packages.bookNow': 'এই প্যাকেজ বুক করুন',
    'packages.mostPopular': 'সবচেয়ে জনপ্রিয় পছন্দ',
    'packages.perPerson': 'প্রতি ব্যক্তি',
    'packages.showMore': 'আরও দেখুন',
    'packages.showLess': 'কম দেখুন',
    
    // Visa
    'visa.title': 'ভিসা সেবা',
    'visa.subtitle': 'ঝামেলামুক্ত ভিসা প্রসেসিং',
    'visa.description': 'আমরা উচ্চ সাফল্যের হার সহ একাধিক দেশের জন্য ব্যাপক ভিসা প্রসেসিং সেবা প্রদান করি।',
    'visa.processingTime': 'প্রসেসিং সময়',
    'visa.applyNow': 'আবেদন করুন',
    'visa.viewAll': 'সব দেশ দেখুন',
    
    // Testimonials
    'testimonials.title': 'তীর্থযাত্রীদের প্রশংসাপত্র',
    'testimonials.subtitle': 'আমাদের তীর্থযাত্রীরা কী বলেন',
    
    // Team
    'team.title': 'আমাদের টিম',
    'team.subtitle': 'আমাদের টিমের সাথে পরিচিত হন',
    'team.managementBoard': 'ম্যানেজমেন্ট বোর্ড',
    'team.shariahBoard': 'শরিয়াহ বোর্ড',
    
    // FAQ
    'faq.title': 'সাধারণ জিজ্ঞাসা',
    'faq.subtitle': 'প্রশ্ন আছে?',
    
    // Contact
    'contact.title': 'যোগাযোগ করুন',
    'contact.subtitle': 'যোগাযোগ করুন',
    'contact.description': 'আমাদের হজ্জ বা উমরাহ প্যাকেজ সম্পর্কে প্রশ্ন আছে? আপনার পবিত্র যাত্রা পরিকল্পনায় সাহায্য করতে আমরা এখানে আছি।',
    'contact.sendMessage': 'আমাদের বার্তা পাঠান',
    'contact.fullName': 'পুরো নাম',
    'contact.email': 'ইমেইল ঠিকানা',
    'contact.phone': 'ফোন নম্বর',
    'contact.message': 'আপনার বার্তা',
    'contact.send': 'বার্তা পাঠান',
    'contact.sending': 'পাঠানো হচ্ছে...',
    'contact.offices': 'আমাদের অফিস',
    
    // Footer
    'footer.quickLinks': 'দ্রুত লিংক',
    'footer.services': 'সেবাসমূহ',
    'footer.contact': 'যোগাযোগ',
    'footer.followUs': 'আমাদের অনুসরণ করুন',
    'footer.rights': 'সর্বস্বত্ব সংরক্ষিত',
    
    // Common
    'common.loading': 'লোড হচ্ছে...',
    'common.error': 'একটি ত্রুটি ঘটেছে',
    'common.success': 'সফল',
    'common.cancel': 'বাতিল',
    'common.submit': 'জমা দিন',
    'common.close': 'বন্ধ করুন',
  },
  ar: {
    // Header
    'nav.home': 'الرئيسية',
    'nav.hajj': 'باقات الحج',
    'nav.umrah': 'باقات العمرة',
    'nav.services': 'الخدمات',
    'nav.visa': 'خدمات التأشيرة',
    'nav.about': 'من نحن',
    'nav.contact': 'اتصل بنا',
    'nav.bookNow': 'احجز الآن',
    'nav.login': 'تسجيل الدخول',
    'nav.myBookings': 'حجوزاتي',
    'nav.adminDashboard': 'لوحة التحكم',
    'nav.signOut': 'تسجيل الخروج',
    
    // Hero Section
    'hero.badge': 'وكالة حج وعمرة معتمدة من الحكومة',
    'hero.title': 'رحلتك المقدسة تبدأ من هنا',
    'hero.subtitle': 'عش تجربة الحج العمر',
    'hero.description': 'نقدم باقات حج وعمرة شاملة مع إقامة فاخرة وإرشاد متخصص ورعاية كاملة طوال رحلتك الروحانية.',
    'hero.explorePackages': 'استكشف الباقات',
    'hero.watchVideo': 'شاهد الفيديو',
    'hero.yearsExperience': 'سنوات الخبرة',
    'hero.happyPilgrims': 'حاج سعيد',
    'hero.successRate': 'نسبة النجاح',
    
    // Services
    'services.title': 'خدمات الحج والعمرة الكاملة',
    'services.subtitle': 'لماذا تختارنا',
    'services.flightBooking': 'حجز الطيران',
    'services.flightDesc': 'خطوط طيران فاخرة مع ترتيبات سفر مريحة إلى المملكة العربية السعودية',
    'services.hotelAccommodation': 'الإقامة الفندقية',
    'services.hotelDesc': 'فنادق مختارة بعناية بالقرب من الحرم لسهولة الوصول للعبادة',
    'services.visaProcessing': 'معالجة التأشيرة',
    'services.visaDesc': 'نسبة نجاح 100% في معالجة تأشيرات الحج والعمرة',
    'services.expertGuides': 'مرشدون خبراء',
    'services.guidesDesc': 'علماء إسلاميون ذوو خبرة لإرشادك خلال المناسك',
    'services.support': 'دعم على مدار الساعة',
    'services.supportDesc': 'مساعدة على مدار الساعة طوال رحلتك الروحانية',
    'services.completeCare': 'رعاية كاملة',
    'services.careDesc': 'من المغادرة إلى العودة، نتعامل مع كل التفاصيل بعناية',
    
    // Packages
    'packages.hajj': 'باقات الحج',
    'packages.umrah': 'باقات العمرة',
    'packages.hajjArabic': 'حَجّ',
    'packages.umrahArabic': 'عُمْرَة',
    'packages.hajjDesc': 'أدِّ الركن الخامس من أركان الإسلام مع باقات الحج المصممة بعناية. نضمن تجربة روحانية غنية ومريحة لكل حاج.',
    'packages.umrahDesc': 'ابدأ رحلتك الروحانية مع باقات العمرة الحصرية. نقدم إقامة فاخرة ومواصلات وإرشاد.',
    'packages.bookNow': 'احجز هذه الباقة',
    'packages.mostPopular': 'الخيار الأكثر شعبية',
    'packages.perPerson': 'للشخص الواحد',
    'packages.showMore': 'عرض المزيد',
    'packages.showLess': 'عرض أقل',
    
    // Visa
    'visa.title': 'خدمات التأشيرة',
    'visa.subtitle': 'معالجة تأشيرة بدون متاعب',
    'visa.description': 'نقدم خدمات معالجة تأشيرات شاملة لعدة دول مع نسب نجاح عالية.',
    'visa.processingTime': 'وقت المعالجة',
    'visa.applyNow': 'تقدم الآن',
    'visa.viewAll': 'عرض جميع الدول',
    
    // Testimonials
    'testimonials.title': 'شهادات الحجاج',
    'testimonials.subtitle': 'ماذا يقول حجاجنا',
    
    // Team
    'team.title': 'فريقنا',
    'team.subtitle': 'تعرف على فريقنا',
    'team.managementBoard': 'مجلس الإدارة',
    'team.shariahBoard': 'الهيئة الشرعية',
    
    // FAQ
    'faq.title': 'الأسئلة الشائعة',
    'faq.subtitle': 'لديك أسئلة؟',
    
    // Contact
    'contact.title': 'اتصل بنا',
    'contact.subtitle': 'تواصل معنا',
    'contact.description': 'لديك أسئلة حول باقات الحج أو العمرة؟ نحن هنا لمساعدتك في التخطيط لرحلتك المقدسة.',
    'contact.sendMessage': 'أرسل لنا رسالة',
    'contact.fullName': 'الاسم الكامل',
    'contact.email': 'البريد الإلكتروني',
    'contact.phone': 'رقم الهاتف',
    'contact.message': 'رسالتك',
    'contact.send': 'إرسال الرسالة',
    'contact.sending': 'جاري الإرسال...',
    'contact.offices': 'مكاتبنا',
    
    // Footer
    'footer.quickLinks': 'روابط سريعة',
    'footer.services': 'الخدمات',
    'footer.contact': 'اتصل بنا',
    'footer.followUs': 'تابعنا',
    'footer.rights': 'جميع الحقوق محفوظة',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.success': 'نجاح',
    'common.cancel': 'إلغاء',
    'common.submit': 'إرسال',
    'common.close': 'إغلاق',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('language', language);
    
    // Update HTML attributes for RTL support
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    // Add/remove RTL class for styling
    if (isRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
