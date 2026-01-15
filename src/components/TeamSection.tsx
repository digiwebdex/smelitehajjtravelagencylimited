import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  qualifications?: string;
  avatar_url?: string;
  board_type: string;
  order_index: number;
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
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-3 mb-6">
            Management Board
          </h2>
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
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24"
        >
          {managementTeam.map((member) => (
            <motion.div
              key={member.id}
              variants={cardVariants}
              whileHover={{ y: -8 }}
              className="bg-card rounded-2xl p-8 shadow-elegant hover:shadow-lg transition-all duration-300 group text-center relative overflow-hidden"
            >
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
              
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-28 h-28 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-elegant relative z-10 overflow-hidden"
              >
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-heading font-bold text-primary-foreground">
                    {getInitials(member.name)}
                  </span>
                )}
              </motion.div>
              <h3 className="font-heading font-bold text-xl text-foreground mb-2">
                {member.name}
              </h3>
              <p className="text-secondary font-semibold text-sm mb-4 uppercase tracking-wide">
                {member.role}
              </p>
              {member.qualifications && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {member.qualifications}
                </p>
              )}
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
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Shariah Board
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Our Shariah advisors ensure all our services comply with Islamic principles.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            >
              {shariahBoard.map((member) => (
                <motion.div
                  key={member.id}
                  variants={cardVariants}
                  whileHover={{ y: -8 }}
                  className="bg-gradient-to-br from-muted to-card rounded-2xl p-8 shadow-elegant hover:shadow-lg transition-all duration-300 group flex items-center gap-6"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 shadow-gold overflow-hidden"
                  >
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-heading font-bold text-secondary-foreground">
                        {getInitials(member.name)}
                      </span>
                    )}
                  </motion.div>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-foreground mb-1">
                      {member.name}
                    </h3>
                    <p className="text-primary font-semibold text-sm mb-2 uppercase tracking-wide">
                      {member.role}
                    </p>
                    {member.qualifications && (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {member.qualifications}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};

export default TeamSection;
