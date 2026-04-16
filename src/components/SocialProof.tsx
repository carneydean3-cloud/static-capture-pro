import { motion } from "motion/react";
import { Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const conversionTestimonials = [
  {
    name: "Sarah K.",
    role: "SaaS Founder",
    text: "ConversionDoc found 12 issues I'd been blind to for months. Our sign-up rate jumped 34% after implementing the fixes — and the AI search readiness check flagged gaps I hadn't even considered.",
    rating: 5,
    initials: "SK",
  },
  {
    name: "Marcus T.",
    role: "E-commerce Owner",
    text: "The rewritten copy alone was worth 10x the price. It's like having a conversion expert and an SEO strategist in one place. The 7-pillar breakdown made every issue impossible to ignore.",
    rating: 5,
    initials: "MT",
  },
  {
    name: "Emily R.",
    role: "Agency Director",
    text: "We now run every client landing page through ConversionDoc before launch. The AI search readiness audit has become a key part of our deliverable. Clients love it.",
    rating: 5,
    initials: "ER",
  },
];

const geoTestimonials = [
  {
    name: "James P.",
    role: "SaaS Founder",
    text: "I had no idea how invisible my pages were to AI search engines. The GEO audit flagged gaps in structure and answerability I'd never have spotted. We restructured three pages and started appearing in ChatGPT answers within weeks.",
    rating: 5,
    initials: "JP",
  },
  {
    name: "Priya M.",
    role: "Course Creator",
    text: "The audit showed exactly why AI tools weren't citing my content. The fixes were specific and actionable — not vague SEO advice. My content is now being referenced in AI-generated answers for my core topics.",
    rating: 5,
    initials: "PM",
  },
  {
    name: "Daniel W.",
    role: "Agency Director",
    text: "We've added the GEO audit to every client onboarding. It gives us a clear before-and-after story around AI search visibility — something clients increasingly ask about. ConversionDoc made it easy to deliver.",
    rating: 5,
    initials: "DW",
  },
];

const conversionStats = [
  { value: "300+", label: "Founders and teams" },
  { value: "7", label: "Conversion pillars checked" },
  { value: "60s", label: "Results delivered" },
  { value: "£149", label: "One-time full diagnosis" },
];

const geoStats = [
  { value: "300+", label: "Founders and teams" },
  { value: "7", label: "GEO dimensions scored" },
  { value: "60s", label: "Results delivered" },
  { value: "£149", label: "One-time full GEO audit" },
];

const SocialProof = () => {
  const isGeoMode = window.location.pathname.includes("geo-audit");
  
  const activeColor = isGeoMode ? "text-neon" : "text-pulse";

  const testimonials = isGeoMode ? geoTestimonials : conversionTestimonials;
  const stats = isGeoMode ? geoStats : conversionStats;

  return (
    <section className="py-24 px-6 bg-obsidian border-t border-surgical">
      <div className="max-w-7xl mx-auto">

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#0A0A0A] border border-surgical rounded-lg p-6 text-center"
            >
              <div className={`text-4xl font-black mb-2 ${activeColor}`}>
                {stat.value}
              </div>
              <div className="text-xs font-mono font-bold text-data uppercase tracking-widest opacity-80">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Heading */}
        <div className="text-center mb-20">
          <span className={`font-mono text-xs font-bold uppercase tracking-widest mb-4 block ${activeColor}`}>
            Performance Evidence
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-clinic">
            {isGeoMode
              ? "Trusted by teams adapting to AI search."
              : "Trusted by founders who demand conversions."}
          </h2>
          <p className="text-lg text-data max-w-2xl mx-auto">
            {isGeoMode
              ? "From indie makers to agency teams — ConversionDoc helps businesses understand and improve how AI engines read, retrieve, and cite their content."
              : "From indie makers to agency teams — ConversionDoc helps people find and fix the psychological friction stopping their pages from performing."}
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-[#0A0A0A] border border-surgical rounded-lg p-8"
            >
              <div className="flex gap-1 mb-6">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 fill-current ${activeColor}`}
                  />
                ))}
              </div>
              <p className="text-sm text-data leading-relaxed mb-8">
                "{t.text}"
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 ring-1 ring-surgical">
                  <AvatarImage
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      t.name
                    )}&background=1A1A1A&color=fff&bold=true&size=80`}
                    alt={t.name}
                  />
                  <AvatarFallback className="bg-[#1A1A1A] text-white text-sm font-bold">
                    {t.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-sm text-clinic">{t.name}</div>
                  <div className="text-xs text-data font-mono mt-0.5">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
