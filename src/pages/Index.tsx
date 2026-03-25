import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import ResultsPreview from "@/components/ResultsPreview";
import WhatYouGet from "@/components/WhatYouGet";
import Pricing from "@/components/Pricing";
import SocialProof from "@/components/SocialProof";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
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

export default Index;
