import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage, Language } from "@/contexts/LanguageContext";

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'bn', name: 'Bangla', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
}

const LanguageSelector = ({ variant = 'default' }: LanguageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors ${
          variant === 'compact' ? 'text-sm' : ''
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-foreground font-medium hidden sm:inline">
          {currentLanguage.nativeName}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 right-0 z-50 min-w-[180px] bg-card border border-border rounded-xl shadow-elegant overflow-hidden"
            >
              {languages.map((lang) => (
                <motion.button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors ${
                    language === lang.code ? 'bg-primary/10' : ''
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <div className="flex flex-col items-start flex-1">
                    <span className={`font-medium ${
                      language === lang.code ? 'text-primary' : 'text-foreground'
                    }`}>
                      {lang.nativeName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {lang.name}
                    </span>
                  </div>
                  {language === lang.code && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;
