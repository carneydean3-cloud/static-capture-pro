import { motion } from "motion/react";
import { Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
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

const stats = [
  { value: "300+", label: "Founders and teams" },
  { value: "7", label: "Conversion pillars checked" },
  { value: "60s", label: "Results delivered" },
  { value: "£149", label: "One-time full diagnosis" },
];

const SocialProof = () => (
  <section className="py-24 px-6 bg-navy-dark/30">
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
            className="glass-card p-6 text-center"
          >
            <div className="text-3xl font-bold text-primary mb-1">
              {stat.value}
            </div>
            <div className="text-xs font-medium text-caption uppercase tracking-widest">
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Heading */}
      <div className="text-center mb-20">
        <span className="section-label mb-4 block">Testimonials</span>
        <h2 className="section-heading mb-6">
          Loved by founders who ship.
        </h2>
        <p className="body-text max-w-2xl mx-auto">
          From indie makers to agency teams — ConversionDoc helps people
          find and fix the problems stopping their pages from performing.
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
            className="glass-card p-8"
          >
            <div className="flex gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-score-amber text-score-amber"
                />
              ))}
            </div>
            <p className="text-sm text-body leading-relaxed mb-6">
              "{t.text}"
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    t.name
                  )}&background=0f766e&color=fff&bold=true&size=80`}
                  alt={t.name}
                />
                <AvatarFallback className="bg-primary/30 text-white text-sm font-bold">
                  {t.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-bold text-sm">{t.name}</div>
                <div className="text-xs text-caption">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProof;
