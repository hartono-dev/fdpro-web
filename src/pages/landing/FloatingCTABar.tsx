import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { LeadFormModal } from "@/components/LeadFormModal";
import useObserveScroll from "@/hooks/useObserveScroll";
import type { RefObject } from "react";

interface FloatingCTABarProps {
  hasReferral: boolean;
  targetRef: RefObject<HTMLDivElement | null>;
}

const FloatingCTABar = ({ hasReferral, targetRef }: FloatingCTABarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const isTargetOutOfView = useObserveScroll(targetRef);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const referralId = params.get("ref") || localStorage.getItem("referralCode") || undefined;

  useEffect(() => {
    setIsVisible(isTargetOutOfView);
  }, [isTargetOutOfView]);

  return (
    <>
      <div
        aria-hidden={!isVisible}
        className={`fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="px-3 py-2 flex flex-col items-center gap-1">
          {/* Trust badges */}
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-0.5">
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Resmi Diawasi OJK
            </span>
            <span className="flex items-center gap-0.5">
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              100% Dana Terproteksi
            </span>
          </div>
          
          {/* === TUGAS 2: LOGIKA KONDISIONAL UNTUK TOMBOL CTA === */}
          <div className="w-full max-w-md mx-auto">
            {hasReferral ? (
              // Versi Referral: 2 tombol
              <div className="grid grid-cols-2 gap-2">
                {/* Tombol "Daftar" membuka modal registrasi */}
                <LeadFormModal
                  trigger={
                    <Button variant="secondary" className="w-full text-sm py-3 h-auto font-semibold">
                      Daftar
                    </Button>
                  }
                  formType="registration"
                  referralId={referralId}
                />
                <LeadFormModal
                  trigger={
                    <Button variant="default" className="w-full text-sm py-3 h-auto font-semibold bg-primary text-white">
                      Konsultasi
                    </Button>
                  }
                  formType="consultation"
                  referralId={referralId}
                />
              </div>
            ) : (
              // Versi SEO: 1 tombol
              <LeadFormModal
                trigger={
                  <Button variant="default" className="w-full text-sm py-3 h-auto font-semibold bg-primary text-white">
                    Konsultasi Program Sekarang
                  </Button>
                }
                formType="consultation"
              />
            )}
          </div>
        </div>
      </div>

      {/* === TUGAS 1: SEMBUNYIKAN TOMBOL WHATSAPP === */}
      {/* TODO: Aktifkan kembali tombol WA jika sudah dibutuhkan */}
      {/*
      <a
        href="https://wa.me/6281234567890?text=Halo%20FDPro%2C%20saya%20ingin%20konsultasi"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-50 md:hidden w-12 h-12 rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors"
        aria-label="Konsultasi via WhatsApp"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
      */}
    </>
  );
};

export default FloatingCTABar;