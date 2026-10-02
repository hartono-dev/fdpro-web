import { Card, CardContent } from "@/components/ui/Card";
import { ShieldCheck, Monitor, Share2 } from 'lucide-react';

const steps = [
  {
    icon: <ShieldCheck className="h-10 w-10 text-white" />,
    step: 1,
    title: "Amankan Tabungan Keluarga",
    description: "Setor Rp30rb/hari via VA Resmi Asuransi. Dana Anda langsung masuk ke rekening perusahaan asuransi mitra resmi."
  },
  {
    icon: <Monitor className="h-10 w-10 text-white" />,
    step: 2,
    title: "Akses System & Alat Bantu",
    description: "Akses platform digital & materi promosi FDPro. Semua alat yang Anda butuhkan sudah tersedia."
  },
  {
    icon: <Share2 className="h-10 w-10 text-white" />,
    step: 3,
    title: "Bagikan ke 5 Rekan Terdekat",
    description: "Bantu 5 orang terdekat memiliki fondasi tabungan yang sama & bangun tim inti Anda untuk menikmati passive income berjenjang."
  }
];

const HowItWorks = () => {
  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
          Bagaimana Cara Kerja FDPro?
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Hanya 3 langkah sederhana untuk memulai perjalanan finansial 2-in-1 Anda.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item) => (
            <div key={item.step} className="relative">
              <Card className="bg-card shadow-lg text-center">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="bg-primary rounded-full p-4">
                      {item.icon}
                    </div>
                  </div>
                  <div className="bg-secondary text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;