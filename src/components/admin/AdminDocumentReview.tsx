import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Download, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  FileImage,
  File,
  Clock,
  User
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BookingDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  uploaded_at: string;
  user_id: string;
}

interface AdminDocumentReviewProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  customerName: string;
  packageTitle: string;
}

const DOCUMENT_TYPES: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  passport: { label: "Passport Copy", icon: FileImage },
  visa_photo: { label: "Visa Photo", icon: FileImage },
  vaccination: { label: "Vaccination Certificate", icon: FileText },
  medical: { label: "Medical Certificate", icon: FileText },
  travel_insurance: { label: "Travel Insurance", icon: File },
  flight_ticket: { label: "Flight Ticket", icon: File },
  hotel_booking: { label: "Hotel Booking", icon: File },
  other: { label: "Other Document", icon: FileText },
};

const AdminDocumentReview = ({ 
  isOpen, 
  onClose, 
  bookingId, 
  customerName,
  packageTitle 
}: AdminDocumentReviewProps) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<BookingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchDocuments();
    }
  }, [isOpen, bookingId]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booking_documents")
      .select("*")
      .eq("booking_id", bookingId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleView = async (doc: BookingDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("booking-documents")
        .createSignedUrl(doc.file_url, 3600); // 1 hour

      if (error) throw error;

      const ext = doc.file_name.split(".").pop()?.toLowerCase();
      if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) {
        setPreviewType("image");
        setPreviewUrl(data.signedUrl);
      } else if (ext === "pdf") {
        setPreviewType("pdf");
        setPreviewUrl(data.signedUrl);
      } else {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "View failed",
        description: error.message || "Failed to view document",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (doc: BookingDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("booking-documents")
        .createSignedUrl(doc.file_url, 60);

      if (error) throw error;

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentInfo = (type: string) => {
    return DOCUMENT_TYPES[type] || { label: type, icon: FileText };
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Document Review
            </DialogTitle>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{customerName}</span>
              </div>
              <p className="text-xs">{packageTitle}</p>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">No Documents Uploaded</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The customer has not uploaded any documents yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {documents.length} Document{documents.length !== 1 ? "s" : ""} Uploaded
                    </Badge>
                  </div>

                  {documents.map((doc) => {
                    const docInfo = getDocumentInfo(doc.document_type);
                    const Icon = docInfo.icon;
                    const ext = doc.file_name.split(".").pop()?.toLowerCase();
                    const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "");

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-muted-foreground/10 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                            isImage ? "bg-blue-500/10" : "bg-primary/10"
                          )}>
                            <Icon className={cn(
                              "w-6 h-6",
                              isImage ? "text-blue-500" : "text-primary"
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm">
                              {docInfo.label}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {doc.file_name}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(new Date(doc.uploaded_at), "MMM dd, yyyy HH:mm")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleView(doc)}
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="p-4 overflow-auto max-h-[75vh]">
            {previewType === "image" && previewUrl && (
              <img 
                src={previewUrl} 
                alt="Document preview" 
                className="max-w-full h-auto mx-auto rounded-lg"
              />
            )}
            {previewType === "pdf" && previewUrl && (
              <iframe 
                src={previewUrl} 
                className="w-full h-[70vh] rounded-lg"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDocumentReview;
