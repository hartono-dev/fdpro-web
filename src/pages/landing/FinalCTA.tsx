import { Button } from "@/components/ui/Button";
import { LeadFormModal } from "@/components/LeadFormModal";
import { Link } from "react-router-dom"; // Import Link

const FinalCTA = ({ hasReferral, referralCode }: { hasReferral: boolean; referralCode?: string }) => {
  return (
    <section className="bg-primary py-12 md:py-20 px-4 text-center text-primary-foreground">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold leading-tight">
          Amankan Masa Depan Anak & Bangun Sumber Income Kedua Anda Hari Ini.
        </h2>
        <p className="mt-3 text-sm md:text-lg text-gray-300 max-w-2xl mx-auto">
          Mulai dengan Rp30.000 per hari. Dapatkan perlindungan Pendidikan untuk anak Anda plus akses sistem kemitraan bisnis terpandu.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
          {hasReferral ? (
            <>
              {/* Mengganti LeadFormModal dengan Link */}
              <Link
                to={referralCode ? `/register?ref=${referralCode}` : "/register"}
                className="w-full sm:w-auto"
              >
                <Button variant="secondary" size="lg" className="w-full sm:w-auto px-10 py-6 h-auto text-base font-bold shadow-xl hover:scale-105 transition-transform">
                  Daftar Kemitraan
                </Button>
              </Link>
              <LeadFormModal
                trigger={
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-10 py-6 h-auto text-base font-semibold border-white/20 hover:bg-white/10 text-white">
                    Konsultasi Gratis
                  </Button>
                }
                formType="consultation"
                referralId={referralCode}
              />
            </>
          ) : (
            <LeadFormModal
              trigger={
                <Button variant="secondary" size="lg" className="w-full sm:w-auto px-12 py-6 h-auto text-base font-bold shadow-xl hover:scale-105 transition-transform">
                  Konsultasi Program Sekarang
                </Button>
              }
              formType="consultation"
            />
          )}
        </div>

        <p className="mt-6 text-xs text-gray-400 opacity-80">
          🛡️ 100% simpanan disetorkan ke Virtual Account asuransi. FDPro tidak memungut biaya keanggotaan sama sekali.
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;