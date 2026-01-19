import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  Calculator,
  Banknote,
  CalendarDays,
  Bell
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface EMIPayment {
  id: string;
  booking_id: string;
  total_amount: number;
  advance_amount: number;
  number_of_emis: number;
  emi_amount: number;
  paid_emis: number;
  remaining_amount: number;
  is_emi_plan: boolean;
  created_at: string;
}

interface EMIInstallment {
  id: string;
  emi_payment_id: string;
  installment_number: number;
  amount: number;
  due_date: string | null;
  paid_date: string | null;
  status: "pending" | "paid" | "overdue";
  payment_method: string | null;
  transaction_id: string | null;
  notes: string | null;
}

interface AdminEMIManagementProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  totalAmount: number;
  onUpdate: () => void;
}

const AdminEMIManagement = ({
  isOpen,
  onClose,
  bookingId,
  totalAmount,
  onUpdate,
}: AdminEMIManagementProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [emiPayment, setEmiPayment] = useState<EMIPayment | null>(null);
  const [installments, setInstallments] = useState<EMIInstallment[]>([]);
  
  // Form state for creating new EMI plan
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [numberOfEmis, setNumberOfEmis] = useState<number>(3);
  const [calculatedEmi, setCalculatedEmi] = useState<number>(0);
  
  // Form state for recording payment
  const [payingInstallment, setPayingInstallment] = useState<EMIInstallment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [transactionId, setTransactionId] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchEMIData();
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    // Calculate EMI when advance amount or number of EMIs changes
    const remaining = totalAmount - advanceAmount;
    if (numberOfEmis > 0 && remaining > 0) {
      setCalculatedEmi(Math.ceil(remaining / numberOfEmis));
    } else {
      setCalculatedEmi(0);
    }
  }, [advanceAmount, numberOfEmis, totalAmount]);

  const fetchEMIData = async () => {
    setLoading(true);
    
    // Fetch EMI payment plan
    const { data: emiData, error: emiError } = await supabase
      .from("emi_payments")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();
    
    if (emiError) {
      console.error("Error fetching EMI data:", emiError);
    }
    
    if (emiData) {
      setEmiPayment(emiData as EMIPayment);
      
      // Fetch installments
      const { data: installmentData, error: installmentError } = await supabase
        .from("emi_installments")
        .select("*")
        .eq("emi_payment_id", emiData.id)
        .order("installment_number", { ascending: true });
      
      if (!installmentError && installmentData) {
        setInstallments(installmentData as EMIInstallment[]);
      }
    }
    
    setLoading(false);
  };

  const createEMIPlan = async () => {
    if (advanceAmount < 0 || advanceAmount >= totalAmount) {
      toast({
        title: "Invalid Amount",
        description: "Advance amount must be less than total amount",
        variant: "destructive",
      });
      return;
    }

    if (numberOfEmis < 1 || numberOfEmis > 12) {
      toast({
        title: "Invalid EMI Count",
        description: "Number of EMIs must be between 1 and 12",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    const remaining = totalAmount - advanceAmount;
    const emiAmount = Math.ceil(remaining / numberOfEmis);

    // Create EMI payment plan
    const { data: emiData, error: emiError } = await supabase
      .from("emi_payments")
      .insert({
        booking_id: bookingId,
        total_amount: totalAmount,
        advance_amount: advanceAmount,
        number_of_emis: numberOfEmis,
        emi_amount: emiAmount,
        paid_emis: advanceAmount > 0 ? 0 : 0, // Advance is not counted as EMI
        remaining_amount: remaining,
        is_emi_plan: true,
      })
      .select()
      .single();

    if (emiError) {
      toast({
        title: "Error",
        description: "Failed to create EMI plan",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    // Create individual installments
    const installmentsToCreate = [];
    const today = new Date();
    
    for (let i = 1; i <= numberOfEmis; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      installmentsToCreate.push({
        emi_payment_id: emiData.id,
        installment_number: i,
        amount: i === numberOfEmis ? remaining - (emiAmount * (numberOfEmis - 1)) : emiAmount,
        due_date: dueDate.toISOString().split('T')[0],
        status: "pending" as const,
      });
    }

    const { error: installmentError } = await supabase
      .from("emi_installments")
      .insert(installmentsToCreate);

    if (installmentError) {
      toast({
        title: "Error",
        description: "Failed to create installments",
        variant: "destructive",
      });
    } else {
      toast({
        title: "EMI Plan Created",
        description: `${numberOfEmis} installments created successfully`,
      });
      
      // Update booking payment status
      await supabase
        .from("bookings")
        .update({ 
          payment_status: advanceAmount > 0 ? "partial" : "emi_pending",
          payment_method: "emi"
        })
        .eq("id", bookingId);

      // Send EMI plan created notification
      supabase.functions.invoke("send-emi-notification", {
        body: {
          bookingId: bookingId,
          notificationType: "emi_plan_created",
          amount: emiAmount,
          totalEmis: numberOfEmis,
        }
      }).catch(err => console.error("EMI notification error:", err));
      
      fetchEMIData();
      onUpdate();
    }

    setSaving(false);
  };

  const recordInstallmentPayment = async () => {
    if (!payingInstallment || !emiPayment) return;

    setSaving(true);

    // Update installment
    const { error: installmentError } = await supabase
      .from("emi_installments")
      .update({
        status: "paid",
        paid_date: new Date().toISOString(),
        payment_method: paymentMethod,
        transaction_id: transactionId || null,
        notes: paymentNotes || null,
      })
      .eq("id", payingInstallment.id);

    if (installmentError) {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    // Update EMI payment totals
    const newPaidEmis = emiPayment.paid_emis + 1;
    const newRemainingAmount = emiPayment.remaining_amount - payingInstallment.amount;

    const { error: emiError } = await supabase
      .from("emi_payments")
      .update({
        paid_emis: newPaidEmis,
        remaining_amount: newRemainingAmount,
      })
      .eq("id", emiPayment.id);

    if (emiError) {
      console.error("Error updating EMI payment:", emiError);
    }

    // Update booking payment status if all EMIs are paid
    if (newPaidEmis >= emiPayment.number_of_emis) {
      await supabase
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", bookingId);
    }

    // Send payment recorded notification
    supabase.functions.invoke("send-emi-notification", {
      body: {
        bookingId: bookingId,
        notificationType: "payment_recorded",
        installmentNumber: payingInstallment.installment_number,
        amount: payingInstallment.amount,
        paidEmis: newPaidEmis,
        totalEmis: emiPayment.number_of_emis,
        remainingAmount: newRemainingAmount,
      }
    }).catch(err => console.error("EMI notification error:", err));

    toast({
      title: "Payment Recorded",
      description: `Installment ${payingInstallment.installment_number} marked as paid`,
    });

    setPayingInstallment(null);
    setPaymentMethod("cash");
    setTransactionId("");
    setPaymentNotes("");
    fetchEMIData();
    onUpdate();
    setSaving(false);
  };

  const recordAdvancePayment = async () => {
    if (!emiPayment) return;
    
    setSaving(true);
    
    // Just update the booking to reflect advance was paid
    await supabase
      .from("bookings")
      .update({ 
        payment_status: "partial",
        transaction_id: `ADV-${Date.now()}`
      })
      .eq("id", bookingId);

    toast({
      title: "Advance Payment Recorded",
      description: `Advance payment of ${formatCurrency(emiPayment.advance_amount)} recorded`,
    });

    onUpdate();
    setSaving(false);
  };

  const sendManualReminder = async (installment: EMIInstallment) => {
    setSendingReminder(true);
    
    try {
      const { error } = await supabase.functions.invoke("send-emi-notification", {
        body: {
          bookingId: bookingId,
          notificationType: installment.status === "overdue" ? "payment_overdue" : "payment_due",
          installmentNumber: installment.installment_number,
          amount: installment.amount,
          dueDate: installment.due_date,
          paidEmis: emiPayment?.paid_emis,
          totalEmis: emiPayment?.number_of_emis,
          remainingAmount: emiPayment?.remaining_amount,
        }
      });

      if (error) throw error;

      toast({
        title: "Reminder Sent",
        description: `Payment reminder sent for EMI #${installment.installment_number}`,
      });
    } catch (err) {
      console.error("Failed to send reminder:", err);
      toast({
        title: "Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingReminder(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 text-white gap-1"><CheckCircle className="w-3 h-3" />Paid</Badge>;
      case "overdue":
        return <Badge className="bg-red-500 text-white gap-1"><AlertTriangle className="w-3 h-3" />Overdue</Badge>;
      default:
        return <Badge className="bg-yellow-500 text-white gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Installment Payment Management
          </DialogTitle>
          <DialogDescription>
            Total Booking Amount: <span className="font-bold text-primary">{formatCurrency(totalAmount)}</span>
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!emiPayment ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Create Installment Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="advanceAmount">Advance Payment (৳)</Label>
                      <Input
                        id="advanceAmount"
                        type="number"
                        min="0"
                        max={totalAmount - 1}
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional upfront payment
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numberOfEmis">Number of Installments</Label>
                      <Select
                        value={numberOfEmis.toString()}
                        onValueChange={(v) => setNumberOfEmis(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n} {n === 1 ? "Installment" : "Installments"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Advance Payment:</span>
                      <span className="font-medium text-green-600">{formatCurrency(advanceAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining Amount:</span>
                      <span className="font-medium">{formatCurrency(totalAmount - advanceAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-medium">Monthly Installment:</span>
                      <span className="font-bold text-primary">{formatCurrency(calculatedEmi)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      × {numberOfEmis} installments
                    </p>
                  </div>

                  <Button
                    onClick={createEMIPlan}
                    disabled={saving || calculatedEmi <= 0}
                    className="w-full"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Installment Plan
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Installment Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(emiPayment.total_amount)}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Advance Paid</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(emiPayment.advance_amount)}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Installment Progress</p>
                  <p className="text-lg font-bold">{emiPayment.paid_emis}/{emiPayment.number_of_emis}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(emiPayment.remaining_amount)}</p>
                </Card>
              </div>

              {/* Advance Payment Button if not recorded */}
              {emiPayment.advance_amount > 0 && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Banknote className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Advance Payment</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(emiPayment.advance_amount)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={recordAdvancePayment} disabled={saving}>
                      Record Payment
                    </Button>
                  </div>
                </Card>
              )}

              {/* Installments Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Installment Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installments.map((installment) => (
                        <TableRow key={installment.id}>
                          <TableCell className="font-medium">
                            Installment {installment.installment_number}
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(installment.amount)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {installment.due_date
                              ? format(new Date(installment.due_date), "MMM dd, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(installment.status)}</TableCell>
                          <TableCell>
                            {installment.status === "pending" || installment.status === "overdue" ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPayingInstallment(installment)}
                                  className="gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Mark Paid
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => sendManualReminder(installment)}
                                  disabled={sendingReminder}
                                  className="gap-1"
                                  title="Send Reminder"
                                >
                                  {sendingReminder ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Bell className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {installment.paid_date
                                  ? format(new Date(installment.paid_date), "MMM dd")
                                  : "-"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Recording Dialog */}
        <Dialog open={!!payingInstallment} onOpenChange={() => setPayingInstallment(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Installment {payingInstallment?.installment_number} - {formatCurrency(payingInstallment?.amount || 0)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transaction ID (Optional)</Label>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Any payment notes..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPayingInstallment(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={recordInstallmentPayment}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEMIManagement;
