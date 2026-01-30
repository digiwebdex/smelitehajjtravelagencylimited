import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useLeadCapture } from '@/hooks/useLeadCapture';
import { supabase } from '@/integrations/supabase/client';

const leadFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Please enter a valid phone number').max(20),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  package_id: z.string().optional(),
  travel_month: z.date().optional(),
  budget_range: z.string().optional(),
  passport_ready: z.boolean().optional(),
  group_size: z.number().min(1).max(50).optional(),
  message: z.string().max(1000).optional(),
  honeypot: z.string().optional(), // Hidden field for spam protection
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface Package {
  id: string;
  title: string;
  type: string;
  price: number;
}

interface LeadCaptureFormProps {
  className?: string;
  compact?: boolean;
}

const LeadCaptureForm = ({ className, compact = false }: LeadCaptureFormProps) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const { submitLead, isSubmitting } = useLeadCapture();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      package_id: '',
      budget_range: '',
      passport_ready: false,
      group_size: 1,
      message: '',
      honeypot: '',
    },
  });

  useEffect(() => {
    const fetchPackages = async () => {
      const { data } = await supabase
        .from('packages')
        .select('id, title, type, price')
        .eq('is_active', true)
        .order('type', { ascending: true });
      
      if (data) {
        setPackages(data);
      }
    };
    fetchPackages();
  }, []);

  const onSubmit = async (data: LeadFormValues) => {
    const selectedPackage = packages.find(p => p.id === data.package_id);
    
    await submitLead({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      package_id: data.package_id || undefined,
      package_title: selectedPackage?.title,
      travel_month: data.travel_month || null,
      budget_range: data.budget_range || undefined,
      passport_ready: data.passport_ready,
      group_size: data.group_size,
      message: data.message || undefined,
      honeypot: data.honeypot,
    });

    form.reset();
  };

  const hajjPackages = packages.filter(p => p.type === 'hajj');
  const umrahPackages = packages.filter(p => p.type === 'umrah');

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className={cn('space-y-4', className)}
      >
        {/* Honeypot field - hidden from users, visible to bots */}
        <div className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
          <FormField
            control={form.control}
            name="honeypot"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    {...field} 
                    tabIndex={-1} 
                    autoComplete="off"
                    placeholder="Leave empty"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'sm:grid-cols-2')}>
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input placeholder="+880 1XXX-XXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Package Interest */}
        <FormField
          control={form.control}
          name="package_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Package Interest</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {hajjPackages.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Hajj Packages</div>
                      {hajjPackages.map(pkg => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.title}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {umrahPackages.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Umrah Packages</div>
                      {umrahPackages.map(pkg => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.title}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {!compact && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Travel Month */}
              <FormField
                control={form.control}
                name="travel_month"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Preferred Travel Month</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'MMMM yyyy')
                            ) : (
                              <span>Pick a month</span>
                            )}
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

              {/* Budget Range */}
              <FormField
                control={form.control}
                name="budget_range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Range</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Under 200K">Under ৳200,000</SelectItem>
                        <SelectItem value="200K-350K">৳200,000 - ৳350,000</SelectItem>
                        <SelectItem value="350K-500K">৳350,000 - ৳500,000</SelectItem>
                        <SelectItem value="500K+">৳500,000+</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Passport Ready */}
              <FormField
                control={form.control}
                name="passport_ready"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Is your passport ready?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(val) => field.onChange(val === 'yes')}
                        value={field.value ? 'yes' : 'no'}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="passport-yes" />
                          <Label htmlFor="passport-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="passport-no" />
                          <Label htmlFor="passport-no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Group Size */}
              <FormField
                control={form.control}
                name="group_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Size</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={50} 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {/* Message */}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Message</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any specific requirements or questions..."
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-gradient-primary hover:opacity-90" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Inquiry
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default LeadCaptureForm;
