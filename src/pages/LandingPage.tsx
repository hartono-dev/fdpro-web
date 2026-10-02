import { useRef } from "react";
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
import { useReferralTracker } from "@/hooks/useReferralTracker";

const LandingPage = () => {
  const { referralId } = useReferralTracker();
  const ctaRef = useRef<HTMLDivElement | null>(null);

  // Tampilkan "Landing Page Referral" jika ada kode referral VALID:
  //  - masih tersimpan di localStorage (< 60 hari), ATAU
  //  - masih ada di parameter URL (?ref=...).
  // Landing Page SEO hanya tampil bila keduanya kosong / kedaluwarsa.
  const hasReferral = !!referralId;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        <HeroSection ctaRef={ctaRef} />
        <ProblemSection />
        <SolutionSection />
        <TrustSection />
        <IncomeSimulation hasReferral={hasReferral} referralCode={referralId || undefined} />
        <IncomeStreams />
        <HowItWorks />
        <RiskProtection />
        <FounderStory />
        <FAQSection />
        <FinalCTA hasReferral={hasReferral} referralCode={referralId || undefined} />
      </main>
      <Footer />
      <FloatingCTABar hasReferral={hasReferral} targetRef={ctaRef} />
    </div>
  );
};

export default LandingPage;