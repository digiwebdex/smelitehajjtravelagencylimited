import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Building, 
  Copy, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  X, 
  AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string;
  routing_number: string;
  swift_code: string;
}

interface BankTransferDetailsProps {
  bankDetails: BankDetails;
  transactionNumber: string;
  onTransactionNumberChange: (value: string) => void;
  screenshotFile: File | null;
  onScreenshotChange: (file: File | null) => void;
  error?: string;
}

const BankTransferDetails = ({
  bankDetails,
  transactionNumber,
  onTransactionNumberChange,
  screenshotFile,
  onScreenshotChange,
  error,
}: BankTransferDetailsProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      onScreenshotChange(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeScreenshot = () => {
    onScreenshotChange(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const bankInfo = [
    { label: "Bank Name", value: bankDetails.bank_name, key: "bank_name" },
    { label: "Account Name", value: bankDetails.account_name, key: "account_name" },
    { label: "Account Number", value: bankDetails.account_number, key: "account_number" },
    { label: "Branch", value: bankDetails.branch, key: "branch" },
    { label: "Routing Number", value: bankDetails.routing_number, key: "routing_number" },
    { label: "SWIFT Code", value: bankDetails.swift_code, key: "swift_code" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-4"
    >
      {/* Bank Account Details Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Building className="w-5 h-5" />
            Bank Account Details
          </div>
          <Separator />
          <div className="grid gap-2">
            {bankInfo.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between bg-background rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-medium truncate">{item.value}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => copyToClipboard(item.value, item.key)}
                >
                  {copiedField === item.key ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Please transfer the exact amount and save the screenshot
          </p>
        </CardContent>
      </Card>

      {/* Transaction Number Input */}
      <div className="space-y-2">
        <Label htmlFor="transactionNumber" className="flex items-center gap-2">
          Transaction Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="transactionNumber"
          placeholder="Enter your bank transaction number"
          value={transactionNumber}
          onChange={(e) => onTransactionNumberChange(e.target.value)}
          className={error ? "border-destructive" : ""}
        />
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
      </div>

      {/* Screenshot Upload */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Payment Screenshot <span className="text-destructive">*</span>
        </Label>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="screenshot-upload"
        />

        <AnimatePresence mode="wait">
          {!screenshotFile ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full h-24 border-dashed flex flex-col items-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload payment screenshot
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG up to 5MB
                </span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-lg border overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3 bg-muted/50">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-background flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Payment screenshot"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{screenshotFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(screenshotFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={removeScreenshot}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default BankTransferDetails;
