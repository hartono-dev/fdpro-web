import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "./landing/HeroSection";
import ProblemSection from "./landing/ProblemSection";
import SolutionSection from "./landing/SolutionSection";
import TrustSection from "./landing/TrustSection";
import IncomeSimulation from "./landing/IncomeSimulation";
import IncomeStreams from "./landing/IncomeStreams";
import HowItWorks from "./landing/HowItWorks";
import RiskProtection from "./landing/RiskProtection";
import FounderStory from "./landing/FounderStory";
import FAQSection from "./landing/FAQSection";
// Note: FinalCTA.tsx & FloatingCTABar.tsx berada di folder yang sama (./landing).
import FinalCTA from "./landing/FinalCTA";
import FloatingCTABar from "./landing/FloatingCTABar";
import Footer from "@/components/Footer";

const LandingPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const referralCode = params.get("ref");
  const ctaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (referralCode) {
      localStorage.setItem("referralCode", referralCode);
    }
  }, [referralCode]);

  // Logika untuk menentukan TAMPILAN UI (hanya bergantung pada URL saat ini)
  const hasReferral = !!referralCode;

  // Logika untuk mengisi data form (boleh menggunakan localStorage)
  const storedReferral = localStorage.getItem("referralCode");
  const finalReferralCode = referralCode || storedReferral || undefined;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        <HeroSection ctaRef={ctaRef} />
        <ProblemSection />
        <SolutionSection />
        <TrustSection />
        <IncomeSimulation hasReferral={hasReferral} />
        <IncomeStreams />
        <HowItWorks />
        <RiskProtection />
        <FounderStory />
        <FAQSection />
        <FinalCTA hasReferral={hasReferral} referralCode={finalReferralCode} />
      </main>
      <Footer />
      <FloatingCTABar hasReferral={hasReferral} targetRef={ctaRef} />
    </div>
  );
};

export default LandingPage;