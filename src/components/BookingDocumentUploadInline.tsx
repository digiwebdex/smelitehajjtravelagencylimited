import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Loader2,
  CheckCircle,
  AlertCircle,
  FileImage
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface BookingDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  uploaded_at: string;
}

interface BookingDocumentUploadInlineProps {
  bookingId: string;
  userId: string;
}

const DOCUMENT_TYPES = [
  { value: "passport", label: "Passport Copy" },
  { value: "visa_photo", label: "Visa Photo" },
  { value: "vaccination", label: "Vaccination Certificate" },
  { value: "medical", label: "Medical Certificate" },
  { value: "travel_insurance", label: "Travel Insurance" },
  { value: "flight_ticket", label: "Flight Ticket" },
  { value: "hotel_booking", label: "Hotel Booking" },
  { value: "other", label: "Other Document" },
];

const BookingDocumentUploadInline = ({ 
  bookingId, 
  userId 
}: BookingDocumentUploadInlineProps) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<BookingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchDocuments();
    }
  }, [bookingId]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booking_documents")
      .select("*")
      .eq("booking_id", bookingId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedType) {
      toast({
        title: "Select document type",
        description: "Please select a document type before uploading",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, WebP, or PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${bookingId}/${selectedType}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("booking-documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("booking_documents")
        .insert({
          booking_id: bookingId,
          user_id: userId,
          document_type: selectedType,
          file_name: file.name,
          file_url: fileName,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      // Update booking tracking status to documents_received
      await supabase
        .from("bookings")
        .update({ tracking_status: "documents_received" })
        .eq("id", bookingId)
        .eq("tracking_status", "order_submitted");

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully",
      });

      setSelectedType("");
      fetchDocuments();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: BookingDocument) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("booking-documents")
        .remove([doc.file_url]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("booking_documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Document deleted",
        description: "Your document has been removed",
      });

      fetchDocuments();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document",
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

      window.open(data.signedUrl, "_blank");
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getDocumentIcon = (type: string) => {
    if (["passport", "visa_photo"].includes(type)) {
      return FileImage;
    }
    return FileText;
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload Required Documents
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload passport copies, photos, and other required documents for your booking.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Document Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              !selectedType && "opacity-50 pointer-events-none"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop or click to browse
                </p>
                <label>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    disabled={!selectedType || uploading}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!selectedType || uploading}
                    asChild
                  >
                    <span className="cursor-pointer">Choose File</span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG, WebP, PDF (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Uploaded Documents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Uploaded Documents
            </h4>
            {documents.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                {documents.length} uploaded
              </Badge>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-6 bg-muted/30 rounded-lg">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const Icon = getDocumentIcon(doc.document_type);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {getDocumentTypeLabel(doc.document_type)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.file_name} • {formatFileSize(doc.file_size)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.uploaded_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingDocumentUploadInline;
