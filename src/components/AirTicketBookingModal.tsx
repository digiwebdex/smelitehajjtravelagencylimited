import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plane, User, Phone, Plus, Trash2, Loader2, ArrowRight, RotateCw, Route, Baby } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Multi-city route schema
const routeSchema = z.object({
  from_city: z.string().min(1, "Departure city is required"),
  to_city: z.string().min(1, "Destination city is required"),
  travel_date: z.date({ required_error: "Travel date is required" }),
});

const passengerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other"]),
  date_of_birth: z.date({ required_error: "Date of birth is required" }),
  nationality: z.string().min(1, "Nationality is required"),
  passport_number: z.string().optional(),
  passport_expiry: z.date().optional(),
  frequent_flyer_number: z.string().optional(),
  special_service_request: z.string().optional(),
  is_child: z.boolean().default(false),
  child_age: z.number().min(0).max(17).optional(),
});

const formSchema = z.object({
  // Trip Type
  trip_type: z.enum(["one_way", "round_trip", "multi_city"]).default("one_way"),
  cabin_class: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
  
  // Flight Details for one_way and round_trip
  from_city: z.string().optional(),
  to_city: z.string().optional(),
  travel_date: z.date().optional(),
  return_date: z.date().optional(),
  
  // Multi-city routes
  routes: z.array(routeSchema).optional(),
  
  // Contact Details
  contact_email: z.string().email("Valid email is required"),
  contact_phone: z.string().min(10, "Valid phone number is required"),
  country_code: z.string().default("+880"),
  remarks: z.string().optional(),
  
  // Passengers
  passengers: z.array(passengerSchema).min(1, "At least one passenger is required"),
}).refine((data) => {
  if (data.trip_type === "multi_city") {
    return data.routes && data.routes.length >= 2;
  }
  return data.from_city && data.to_city && data.travel_date;
}, {
  message: "Please fill in all required flight details",
  path: ["from_city"],
}).refine((data) => {
  if (data.trip_type === "round_trip") {
    return data.return_date !== undefined;
  }
  return true;
}, {
  message: "Return date is required for round trip",
  path: ["return_date"],
});

type FormData = z.infer<typeof formSchema>;

interface AirTicketBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AirTicketSettings {
  trip_types: { one_way: boolean; round_trip: boolean; multi_city: boolean };
  cabin_classes: { economy: boolean; premium_economy: boolean; business: boolean; first: boolean };
  max_multi_city_routes: number;
  confirmation_message: string;
}

const nationalities = [
  "Bangladeshi", "Indian", "Pakistani", "Nepali", "Sri Lankan", "Malaysian",
  "Indonesian", "Saudi Arabian", "Emirati", "Qatari", "Kuwaiti", "British",
  "American", "Canadian", "Australian", "Other",
];

const cabinClassLabels: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First Class",
};

export default function AirTicketBookingModal({ open, onOpenChange }: AirTicketBookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<AirTicketSettings>({
    trip_types: { one_way: true, round_trip: true, multi_city: true },
    cabin_classes: { economy: true, premium_economy: true, business: true, first: true },
    max_multi_city_routes: 4,
    confirmation_message: "Our team is checking availability. We will contact you shortly with the best options.",
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trip_type: "one_way",
      cabin_class: "economy",
      from_city: "",
      to_city: "",
      contact_email: "",
      contact_phone: "",
      country_code: "+880",
      remarks: "",
      routes: [
        { from_city: "", to_city: "", travel_date: undefined as any },
        { from_city: "", to_city: "", travel_date: undefined as any },
      ],
      passengers: [
        {
          first_name: "",
          last_name: "",
          gender: "male",
          nationality: "Bangladeshi",
          passport_number: "",
          frequent_flyer_number: "",
          special_service_request: "",
          is_child: false,
          child_age: undefined,
        },
      ],
    },
  });

  const { fields: passengerFields, append: appendPassenger, remove: removePassenger } = useFieldArray({
    control: form.control,
    name: "passengers",
  });

  const { fields: routeFields, append: appendRoute, remove: removeRoute } = useFieldArray({
    control: form.control,
    name: "routes",
  });

  const tripType = form.watch("trip_type");

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("air_ticket_settings")
          .select("setting_key, setting_value");

        if (error) throw error;

        if (data) {
          const newSettings = { ...settings };
          data.forEach((item) => {
            if (item.setting_key === "trip_types" && typeof item.setting_value === "object") {
              newSettings.trip_types = item.setting_value as typeof settings.trip_types;
            } else if (item.setting_key === "cabin_classes" && typeof item.setting_value === "object") {
              newSettings.cabin_classes = item.setting_value as typeof settings.cabin_classes;
            } else if (item.setting_key === "max_multi_city_routes") {
              newSettings.max_multi_city_routes = parseInt(String(item.setting_value)) || 4;
            } else if (item.setting_key === "confirmation_message") {
              newSettings.confirmation_message = String(item.setting_value).replace(/^"|"$/g, "");
            }
          });
          setSettings(newSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    if (open) {
      fetchSettings();
    }
  }, [open]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let primaryFrom = "";
      let primaryTo = "";
      let primaryDate = "";

      if (data.trip_type === "multi_city" && data.routes) {
        primaryFrom = data.routes[0].from_city;
        primaryTo = data.routes[data.routes.length - 1].to_city;
        primaryDate = format(data.routes[0].travel_date, "yyyy-MM-dd");
      } else {
        primaryFrom = data.from_city!;
        primaryTo = data.to_city!;
        primaryDate = format(data.travel_date!, "yyyy-MM-dd");
      }

      const bookingData = {
        user_id: user?.id || null,
        from_city: primaryFrom,
        to_city: primaryTo,
        travel_date: primaryDate,
        return_date: data.trip_type === "round_trip" && data.return_date 
          ? format(data.return_date, "yyyy-MM-dd") 
          : null,
        is_round_trip: data.trip_type === "round_trip",
        trip_type: data.trip_type,
        cabin_class: data.cabin_class,
        passenger_count: data.passengers.length,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        country_code: data.country_code,
        remarks: data.remarks || null,
        guest_name: !user ? data.passengers[0].first_name + " " + data.passengers[0].last_name : null,
        guest_email: !user ? data.contact_email : null,
        guest_phone: !user ? data.contact_phone : null,
      };

      const { data: booking, error: bookingError } = await supabase
        .from("air_ticket_bookings")
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Insert passengers
      const passengersData = data.passengers.map((p) => ({
        booking_id: booking.id,
        first_name: p.first_name,
        last_name: p.last_name,
        gender: p.gender,
        date_of_birth: format(p.date_of_birth, "yyyy-MM-dd"),
        nationality: p.nationality,
        passport_number: p.passport_number || null,
        passport_expiry: p.passport_expiry ? format(p.passport_expiry, "yyyy-MM-dd") : null,
        frequent_flyer_number: p.frequent_flyer_number || null,
        special_service_request: p.special_service_request || null,
        is_child: p.is_child || false,
        child_age: p.is_child ? p.child_age : null,
      }));

      const { error: passengersError } = await supabase
        .from("air_ticket_passengers")
        .insert(passengersData);

      if (passengersError) throw passengersError;

      // Insert multi-city routes if applicable
      if (data.trip_type === "multi_city" && data.routes) {
        const routesData = data.routes.map((r, index) => ({
          booking_id: booking.id,
          route_order: index + 1,
          from_city: r.from_city,
          to_city: r.to_city,
          travel_date: format(r.travel_date, "yyyy-MM-dd"),
        }));

        const { error: routesError } = await supabase
          .from("air_ticket_routes")
          .insert(routesData);

        if (routesError) throw routesError;
      }

      setBookingSuccess(booking.booking_id);
      toast({
        title: "Booking Submitted!",
        description: `Your booking ID is ${booking.booking_id}. We will process it shortly.`,
      });

      // Trigger notification
      try {
        await supabase.functions.invoke("send-air-ticket-notification", {
          body: { bookingId: booking.id, type: "submitted" },
        });
      } catch (notifError) {
        console.log("Notification error (non-critical):", notifError);
      }

    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setBookingSuccess(null);
      form.reset();
      onOpenChange(false);
    }
  };

  const availableTripTypes = Object.entries(settings.trip_types)
    .filter(([_, enabled]) => enabled)
    .map(([type]) => type);

  const availableCabinClasses = Object.entries(settings.cabin_classes)
    .filter(([_, enabled]) => enabled)
    .map(([type]) => type);

  if (bookingSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">Booking Submitted Successfully!</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Plane className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">Booking ID</p>
              <p className="text-2xl font-bold text-primary">{bookingSuccess}</p>
            </div>
            <p className="text-muted-foreground text-sm">
              {settings.confirmation_message}
            </p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plane className="w-6 h-6 text-primary" />
            Air Ticket Booking Request
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Section 1: Trip Type Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">1</span>
                  Trip Type
                </h3>
                
                <FormField
                  control={form.control}
                  name="trip_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            {availableTripTypes.includes("one_way") && (
                              <TabsTrigger value="one_way" className="flex items-center gap-2">
                                <ArrowRight className="w-4 h-4" />
                                <span className="hidden sm:inline">One Way</span>
                              </TabsTrigger>
                            )}
                            {availableTripTypes.includes("round_trip") && (
                              <TabsTrigger value="round_trip" className="flex items-center gap-2">
                                <RotateCw className="w-4 h-4" />
                                <span className="hidden sm:inline">Round Trip</span>
                              </TabsTrigger>
                            )}
                            {availableTripTypes.includes("multi_city") && (
                              <TabsTrigger value="multi_city" className="flex items-center gap-2">
                                <Route className="w-4 h-4" />
                                <span className="hidden sm:inline">Multi-City</span>
                              </TabsTrigger>
                            )}
                          </TabsList>
                        </Tabs>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cabin Class */}
                <FormField
                  control={form.control}
                  name="cabin_class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cabin Class</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cabin class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCabinClasses.map((cls) => (
                            <SelectItem key={cls} value={cls}>
                              {cabinClassLabels[cls]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Section 2: Flight Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">2</span>
                  Flight Details
                </h3>
                
                {tripType !== "multi_city" ? (
                  // One Way / Round Trip form
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="from_city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From (Departure City) *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Dhaka" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="to_city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To (Destination City) *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Dubai" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="travel_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Departure Date *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : "Select date"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {tripType === "round_trip" && (
                        <FormField
                          control={form.control}
                          name="return_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Return Date *</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? format(field.value, "PPP") : "Select date"}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  // Multi-City form
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Add up to {settings.max_multi_city_routes} routes (minimum 2)
                      </p>
                      {routeFields.length < settings.max_multi_city_routes && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            appendRoute({ from_city: "", to_city: "", travel_date: undefined as any })
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Route
                        </Button>
                      )}
                    </div>

                    {routeFields.map((field, index) => (
                      <Card key={field.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <Route className="w-4 h-4" />
                              Flight {index + 1}
                            </h4>
                            {routeFields.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRoute(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`routes.${index}.from_city`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>From *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Departure city" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`routes.${index}.to_city`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>To *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Arrival city" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`routes.${index}.travel_date`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Date *</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? format(field.value, "PP") : "Select"}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date()}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Section 3: Traveler Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">3</span>
                    Traveler Information
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendPassenger({
                        first_name: "",
                        last_name: "",
                        gender: "male",
                        date_of_birth: undefined as any,
                        nationality: "Bangladeshi",
                        passport_number: "",
                        frequent_flyer_number: "",
                        special_service_request: "",
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Passenger
                  </Button>
                </div>

                {passengerFields.map((field, index) => (
                  <Card key={field.id} className="bg-muted/30">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Passenger {index + 1}
                        </h4>
                        {passengerFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePassenger(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`passengers.${index}.first_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="First name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`passengers.${index}.last_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`passengers.${index}.gender`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`passengers.${index}.date_of_birth`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date of Birth *</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? format(field.value, "PP") : "Select"}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    captionLayout="dropdown-buttons"
                                    fromYear={1920}
                                    toYear={new Date().getFullYear()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`passengers.${index}.nationality`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nationality *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {nationalities.map((nat) => (
                                    <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`passengers.${index}.passport_number`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Passport Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Optional" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Is Child and Child Age */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`passengers.${index}.is_child`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="flex items-center gap-2">
                                  <Baby className="w-4 h-4 text-primary" />
                                  Is Child Passenger
                                </FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  Check if this passenger is under 18 years old
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />

                        {form.watch(`passengers.${index}.is_child`) && (
                          <FormField
                            control={form.control}
                            name={`passengers.${index}.child_age`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Child Age *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={17}
                                    placeholder="Enter age (0-17)"
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name={`passengers.${index}.special_service_request`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Service Request</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Wheelchair, Meal preference" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Section 4: Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">4</span>
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Type your email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="country_code"
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormLabel>Code</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="+880">+880</SelectItem>
                              <SelectItem value="+91">+91</SelectItem>
                              <SelectItem value="+971">+971</SelectItem>
                              <SelectItem value="+966">+966</SelectItem>
                              <SelectItem value="+1">+1</SelectItem>
                              <SelectItem value="+44">+44</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_phone"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input className="pl-10" placeholder="Type your mobile number" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requirements or preferences..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Plane className="w-5 h-5 mr-2" />
                    Submit Booking Request
                  </>
                )}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
