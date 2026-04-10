import Navbar from "@/components/Navbar";
import GeoHeroSection from "@/components/GeoHeroSection";
import HowItWorks from "@/components/HowItWorks";
import ResultsPreview from "@/components/ResultsPreview";
import WhatYouGet from "@/components/WhatYouGet";
import Pricing from "@/components/Pricing";
import SocialProof from "@/components/SocialProof";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const GeoAudit = () => (
  <div className="min-h-screen">
    <Navbar />
    <GeoHeroSection />
    <HowItWorks />
    <ResultsPreview />
    <WhatYouGet />
    <Pricing />
    <SocialProof />
    <FAQ />
    <FinalCTA />
    <Footer />
  </div>
);

export default GeoAudit;
