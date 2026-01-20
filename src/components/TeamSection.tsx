import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import IslamicBorder from "./IslamicBorder";
import WhatsAppIcon from "./icons/WhatsAppIcon";
import OptimizedImage from "./ui/optimized-image";
interface TeamMember {
  id: string;
  name: string;
  role: string;
  qualifications?: string;
  avatar_url?: string;
  board_type: string;
  order_index: number;
  whatsapp_number?: string;
}

const TeamSection = () => {
  const [managementTeam, setManagementTeam] = useState<TeamMember[]>([]);
  const [shariahBoard, setShariahBoard] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .eq("is_active", true)
      .order("order_index");
    
    if (data && data.length > 0) {
      setManagementTeam(data.filter(m => m.board_type === "management"));
      setShariahBoard(data.filter(m => m.board_type === "shariah"));
    } else {
      // Fallback to default team members
      setManagementTeam([
        { id: "1", name: "A. S. M. Al-Amin", role: "Chairman", qualifications: "Honours Islamic Studies, National University, Bangladesh", board_type: "management", order_index: 0 },
        { id: "2", name: "Mufti Mohammad Arif Hossain", role: "Director & Madina Co-ordinator", qualifications: "Imam and Khatib, Savar Thana Bus-stand Jame Masjid. Senior Muhaddith, Jamia Mahmudia Madrasha.", board_type: "management", order_index: 1 },
        { id: "3", name: "Abul Kalam", role: "Director", qualifications: "Honours Islamic Studies, National University, Bangladesh", board_type: "management", order_index: 2 },
        { id: "4", name: "Muzahidul Islam Nahid", role: "Asst. Director & Makkah Co-ordinator", qualifications: "Masters, Al-Hadith, Islamic Arabic University, Bangladesh", board_type: "management", order_index: 3 },
      ]);
      setShariahBoard([
        { id: "5", name: "Habibullah Mesbah Madani", role: "Shariah Consultant", qualifications: "Honours Islamic Law and Jurisprudence, Madina Islami University, Saudi Arabia", board_type: "shariah", order_index: 0 },
        { id: "6", name: "Anamul Hasan Sadi", role: "Consultant", qualifications: "Hafez, International Qari", board_type: "shariah", order_index: 1 },
      ]);
    }
    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <section id="team" className="py-24 bg-background relative overflow-hidden">
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
      <section id="team" className="py-24 bg-background relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      
        <div className="container relative z-10">
          {/* Management Board */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 text-secondary font-semibold uppercase tracking-wider">
              <Users className="w-4 h-4" />
              Meet Our Team
            </span>
            <h2 className="font-calligraphy text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-3 mb-4">
              Management Board
            </h2>
            <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mb-6">فريقنا</span>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Our dedicated team of experienced professionals ensures your sacred journey 
              is comfortable, safe, and spiritually fulfilling.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24"
          >
            {managementTeam.map((member) => (
              <motion.div
                key={member.id}
                variants={cardVariants}
                whileHover={{ y: -8 }}
                className="bg-card rounded-2xl shadow-elegant hover:shadow-lg transition-all duration-300 group text-center overflow-hidden border-b-4 border-secondary"
              >
                {/* Square Image Container */}
                <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  {member.avatar_url ? (
                    <OptimizedImage 
                      src={member.avatar_url} 
                      alt={member.name}
                      className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
                      <span className="text-6xl font-heading font-bold text-primary-foreground">
                        {getInitials(member.name)}
                      </span>
                    </div>
                  )}
                  {/* Hover Overlay with Bio */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                    <p className="text-white/90 text-sm leading-relaxed line-clamp-4">
                      {member.qualifications || "Dedicated professional committed to providing exceptional Hajj & Umrah services."}
                    </p>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <h3 className="font-heading font-bold text-xl text-foreground mb-2">
                    {member.name}
                  </h3>
                  <p className="text-secondary font-semibold text-sm uppercase tracking-wide mb-3">
                    {member.role}
                  </p>
                  {member.whatsapp_number && (
                    <a
                      href={`https://wa.me/${member.whatsapp_number.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[#25D366] hover:text-[#128C7E] transition-colors font-medium"
                    >
                      <WhatsAppIcon size={18} />
                      {member.whatsapp_number}
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Shariah Board */}
          {shariahBoard.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="font-calligraphy text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                  Shariah Board
                </h2>
                <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mb-6">مجلس الشريعة</span>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Our Shariah advisors ensure all our services comply with Islamic principles.
                </p>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid md:grid-cols-2 gap-6 lg:gap-8"
              >
                {shariahBoard.map((member) => (
                  <motion.div
                    key={member.id}
                    variants={cardVariants}
                    whileHover={{ y: -8 }}
                    className="bg-card rounded-2xl shadow-elegant hover:shadow-lg transition-all duration-300 group overflow-hidden flex border-b-4 border-secondary"
                  >
                    {/* Square Image Container */}
                    <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-48 md:h-48 lg:w-60 lg:h-60 flex-shrink-0 overflow-hidden bg-gradient-to-br from-secondary/20 to-secondary/5">
                      {member.avatar_url ? (
                        <OptimizedImage 
                          src={member.avatar_url} 
                          alt={member.name}
                          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <span className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-secondary-foreground">
                            {getInitials(member.name)}
                          </span>
                        </div>
                      )}
                      {/* Hover Overlay with Bio */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center p-4">
                        <p className="text-white/90 text-sm leading-relaxed text-center line-clamp-5">
                          {member.qualifications || "Shariah expert ensuring Islamic compliance."}
                        </p>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-5 sm:p-6 lg:p-8 flex flex-col justify-center flex-1">
                      <h3 className="font-heading font-bold text-lg sm:text-xl lg:text-2xl text-foreground mb-2">
                        {member.name}
                      </h3>
                      <p className="text-primary font-semibold text-xs sm:text-sm lg:text-base uppercase tracking-wide">
                        {member.role}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </section>
    </IslamicBorder>
  );
};

export default TeamSection;