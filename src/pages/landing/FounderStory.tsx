import { Card, CardContent } from "@/components/ui/Card";
import { Quote } from 'lucide-react';

const FounderStory = () => {
  return (
    <section className="bg-primary py-20 px-4 text-primary-foreground">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-sm border-none text-white shadow-xl">
          <CardContent className="p-8 md:p-12">
            <div className="flex justify-center mb-6">
              <Quote className="h-12 w-12 text-secondary opacity-60" />
            </div>
            <blockquote className="text-lg md:text-xl leading-relaxed text-center italic">
              "FDPro lahir dari kegelisahan saya melihat banyak orang yang ingin membangun masa depan finansial keluarga, tapi terhalang waktu dan khawatir akan risiko. Saya ingin menciptakan solusi tengah—bukan sekadar tabungan, bukan juga sekadar bisnis—tapi kombinasi keduanya yang aman, terpandu, dan bisa dijalankan dari rumah tanpa meninggalkan pekerjaan utama. Inilah FDPro."
            </blockquote>
            <div className="mt-6 text-center">
              <p className="font-semibold text-secondary">— Hartono Sung, Founder FDPro</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default FounderStory;