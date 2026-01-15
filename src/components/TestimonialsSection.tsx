import { useState, useEffect } from "react";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import IslamicBorder from "./IslamicBorder";

interface Testimonial {
  id: string;
  name: string;
  location?: string;
  package_name?: string;
  rating: number;
  quote: string;
  avatar_url?: string;
}

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_active", true)
      .order("order_index");
    
    if (data && data.length > 0) {
      setTestimonials(data);
    } else {
      // Fallback to default testimonials
      setTestimonials([
        {
          id: "1",
          name: "Mohammad Rahman",
          location: "Dhaka, Bangladesh",
          package_name: "Hajj Premium 2025",
          rating: 5,
          quote: "Alhamdulillah, the Hajj experience with SM Elite was beyond our expectations. The team took care of everything - from visa to comfortable accommodation near Haram. The guides were knowledgeable and caring. Highly recommend!",
        },
        {
          id: "2",
          name: "Fatima Begum",
          location: "Chittagong, Bangladesh",
          package_name: "Umrah Economy",
          rating: 5,
          quote: "As a first-time Umrah pilgrim, I was nervous about the journey. SM Elite made everything so easy. The hotel was very close to Masjid al-Haram, and the group leader helped us perform all rituals correctly. JazakAllah!",
        },
        {
          id: "3",
          name: "Abdul Karim",
          location: "Sylhet, Bangladesh",
          package_name: "Hajj VIP 2024",
          rating: 5,
          quote: "The VIP package was worth every penny. 5-star hotel adjacent to Haram, business class flights, and personal attention from staff. My parents performed Hajj comfortably at their age. Thank you SM Elite!",
        },
      ]);
    }
    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-b from-background to-muted overflow-hidden">
        <div className="container">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <IslamicBorder>
      <section className="py-24 bg-gradient-to-b from-background to-muted overflow-hidden">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-secondary font-semibold uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="font-calligraphy text-4xl md:text-5xl font-bold text-foreground mt-3 mb-2">
            What Our Pilgrims Say
          </h2>
          <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mb-6">شهادات</span>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Read authentic experiences from our valued pilgrims who trusted us 
            with their sacred journey.
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="bg-card rounded-2xl p-6 shadow-elegant h-full flex flex-col relative group hover:shadow-lg transition-all duration-300">
                  <Quote className="w-10 h-10 text-secondary/30 absolute top-4 right-4" />
                  
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-secondary fill-secondary" />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-foreground/80 text-sm leading-relaxed flex-grow mb-6">
                    "{testimonial.quote}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center overflow-hidden">
                      {testimonial.avatar_url ? (
                        <img src={testimonial.avatar_url} alt={testimonial.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary-foreground font-heading font-bold">
                          {getInitials(testimonial.name)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-foreground">
                        {testimonial.name}
                      </h4>
                      {testimonial.location && (
                        <p className="text-xs text-muted-foreground">
                          {testimonial.location}
                        </p>
                      )}
                      {testimonial.package_name && (
                        <p className="text-xs text-secondary font-medium">
                          {testimonial.package_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12" />
          <CarouselNext className="hidden md:flex -right-12" />
        </Carousel>
      </div>
      </section>
    </IslamicBorder>
  );
};

export default TestimonialsSection;
