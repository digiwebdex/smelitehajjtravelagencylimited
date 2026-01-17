import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, Wallet, Banknote, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: string | null;
  onSelect: (methodSlug: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  CreditCard,
  Smartphone,
  Wallet,
  Banknote,
};

const PaymentMethodSelector = ({ selectedMethod, onSelect }: PaymentMethodSelectorProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { isRTL } = useLanguage();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("id, name, slug, description, icon_name")
        .eq("is_enabled", true)
        .order("order_index");

      if (error) throw error;
      setPaymentMethods((data || []) as PaymentMethod[]);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No payment methods available
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Select Payment Method</Label>
      <RadioGroup
        value={selectedMethod || undefined}
        onValueChange={onSelect}
        className="grid gap-3"
      >
        {paymentMethods.map((method) => {
          const IconComponent = iconMap[method.icon_name] || CreditCard;
          const isSelected = selectedMethod === method.slug;

          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onSelect(method.slug)}
            >
              <CardContent className="p-4">
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <RadioGroupItem value={method.slug} id={method.id} />
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <IconComponent className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <Label 
                      htmlFor={method.id} 
                      className="font-medium cursor-pointer"
                    >
                      {method.name}
                    </Label>
                    {method.description && (
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default PaymentMethodSelector;
