import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { LeadFormModal } from "@/components/LeadFormModal";
import type { RefObject } from "react";

interface HeroSectionProps {
  ctaRef: RefObject<HTMLDivElement | null>;
}

const HeroSection = ({ ctaRef }: HeroSectionProps) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentReferralId = params.get("ref") || undefined;

  const showReferralButtons = !!currentReferralId;

  const registrationButton = (
    <Button variant="secondary" size="lg" className="text-sm px-8 py-5 h-auto">
      Daftar Kemitraan
    </Button>
  );

  const consultationButton = (
    <LeadFormModal
      trigger={<button className="text-secondary hover:text-secondary/80 text-sm font-semibold underline">Konsultasi di Sini</button>}
      formType="consultation"
    />
  );

  return (
    <section id="hero-section" className="bg-primary py-8 md:py-24 px-4 text-center relative">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-4 md:mb-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium text-blue-100 shadow-sm">
          <span className="text-base leading-none">🛡️</span>
          <span>
            <strong className="text-white font-semibold">Resmi Diawasi OJK</strong>
            <span className="opacity-60 mx-1">|</span>
            Partner Asuransi Jiwa Nasional
          </span>
        </div>

        <h1 className="text-[clamp(1.3rem,4.5vw,2.5rem)] md:text-5xl font-bold leading-snug text-primary-foreground max-w-3xl mx-auto">
          Amankan Masa Depan Anak & Bangun Penghasilan Sampingan Terpandu
        </h1>

        <p className="mt-3 md:mt-6 text-xs md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Mulai Rp30 ribu/hari. Dapatkan perlindungan pendidikan & akses bisnis dari rumah tanpa tinggalkan pekerjaan utama.
        </p>

        <div ref={ctaRef} className="mt-5 md:mt-10 flex flex-col justify-center items-center gap-3">
          {showReferralButtons ? (
            <>
              <LeadFormModal
                trigger={registrationButton}
                formType="registration"
                referralId={currentReferralId}
              />
              <div className="text-center">
                <span className="text-gray-300 text-xs">Masih ada yang ingin ditanyakan? </span>
                {consultationButton}
              </div>
            </>
          ) : (
            <LeadFormModal
              trigger={
                <Button variant="secondary" size="lg" className="text-sm px-8 py-5 h-auto">
                  Konsultasi Program Sekarang
                </Button>
              }
              formType="consultation"
            />
          )}
        </div>

        <p className="mt-3 text-[10px] md:text-xs text-gray-400">
          🛡️ Setoran 100% Masuk ke Tabungan Virtual Account Resmi OJK. Tanpa Biaya Keanggotaan Platform FDPro.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;