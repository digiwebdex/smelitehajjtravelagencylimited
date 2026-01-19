import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InstallmentDetailsProps {
  bookingId: string;
}

interface EMIPayment {
  id: string;
  total_amount: number;
  advance_amount: number;
  emi_amount: number;
  number_of_emis: number;
  paid_emis: number;
  remaining_amount: number;
}

interface Installment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string | null;
  status: string;
  paid_date: string | null;
}

const InstallmentDetails = ({ bookingId }: InstallmentDetailsProps) => {
  const [loading, setLoading] = useState(true);
  const [emiPayment, setEmiPayment] = useState<EMIPayment | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchInstallmentData();
  }, [bookingId]);

  const fetchInstallmentData = async () => {
    try {
      // Fetch EMI payment info
      const { data: emiData } = await supabase
        .from("emi_payments")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (emiData) {
        setEmiPayment(emiData);

        // Fetch installments
        const { data: installmentData } = await supabase
          .from("emi_installments")
          .select("*")
          .eq("emi_payment_id", emiData.id)
          .order("installment_number", { ascending: true });

        if (installmentData) {
          setInstallments(installmentData);
        }
      }
    } catch (error) {
      console.error("Error fetching installment data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 pt-4 border-t border-dashed">
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!emiPayment) {
    return null; // No installment plan for this booking
  }

  const progressPercent = (emiPayment.paid_emis / emiPayment.number_of_emis) * 100;
  const today = new Date();

  const getStatusBadge = (status: string, dueDate: string | null) => {
    if (status === "paid") {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    }
    
    if (dueDate && new Date(dueDate) < today) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="w-3 h-3" />
        Pending
      </Badge>
    );
  };

  const upcomingInstallments = installments.filter(
    (i) => i.status === "pending" && i.due_date && new Date(i.due_date) >= today
  );
  const overdueInstallments = installments.filter(
    (i) => i.status === "pending" && i.due_date && new Date(i.due_date) < today
  );

  return (
    <div className="mt-4 pt-4 border-t border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
            <div className="flex items-center gap-2 text-left">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="font-medium">Installment Plan</span>
              <Badge variant="outline" className="ml-2">
                {emiPayment.paid_emis}/{emiPayment.number_of_emis} Paid
              </Badge>
              {overdueInstallments.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {overdueInstallments.length} Overdue
                </Badge>
              )}
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Total Amount</p>
              <p className="font-bold">{formatCurrency(emiPayment.total_amount)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Advance Paid</p>
              <p className="font-bold text-green-600">{formatCurrency(emiPayment.advance_amount)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Per Installment</p>
              <p className="font-bold">{formatCurrency(emiPayment.emi_amount)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Remaining</p>
              <p className="font-bold text-primary">{formatCurrency(emiPayment.remaining_amount)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Payment Progress</span>
              <span>{progressPercent.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Upcoming/Overdue Alert */}
          {overdueInstallments.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue Payments
              </div>
              <div className="space-y-1 text-sm">
                {overdueInstallments.map((inst) => (
                  <div key={inst.id} className="flex justify-between">
                    <span>Installment #{inst.installment_number}</span>
                    <span className="font-medium">{formatCurrency(inst.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingInstallments.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium mb-2">
                <Calendar className="w-4 h-4" />
                Upcoming Payments
              </div>
              <div className="space-y-1 text-sm">
                {upcomingInstallments.slice(0, 2).map((inst) => (
                  <div key={inst.id} className="flex justify-between">
                    <span>
                      #{inst.installment_number} - Due {inst.due_date && format(new Date(inst.due_date), "dd MMM yyyy")}
                    </span>
                    <span className="font-medium">{formatCurrency(inst.amount)}</span>
                  </div>
                ))}
                {upcomingInstallments.length > 2 && (
                  <p className="text-muted-foreground text-xs">
                    +{upcomingInstallments.length - 2} more upcoming
                  </p>
                )}
              </div>
            </div>
          )}

          {/* All Installments List */}
          <div className="space-y-2">
            <p className="text-sm font-medium">All Installments</p>
            <div className="divide-y rounded-lg border overflow-hidden">
              {installments.map((inst) => (
                <div
                  key={inst.id}
                  className={cn(
                    "flex items-center justify-between p-3 text-sm",
                    inst.status === "paid" && "bg-green-50/50 dark:bg-green-950/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        inst.status === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      #{inst.installment_number}
                    </div>
                    <div>
                      <p className="font-medium">{formatCurrency(inst.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {inst.due_date
                          ? `Due: ${format(new Date(inst.due_date), "dd MMM yyyy")}`
                          : "No due date"}
                        {inst.paid_date && (
                          <span className="text-green-600 ml-2">
                            • Paid: {format(new Date(inst.paid_date), "dd MMM yyyy")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(inst.status, inst.due_date)}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default InstallmentDetails;
