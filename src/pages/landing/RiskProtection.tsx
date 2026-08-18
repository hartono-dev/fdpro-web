import { Card, CardContent } from "@/components/ui/Card";
import { PiggyBank, ShieldCheck, HeartHandshake, TreePine } from 'lucide-react';

const protections = [
  {
    icon: <PiggyBank className="h-8 w-8 text-white" />,
    title: "Jaminan Nilai Tunai Tabungan",
    description: "Dana tabungan pendidikan anak Anda memiliki nilai tunai yang terjamin dan dapat dicairkan sesuai ketentuan polis.",
    color: "bg-secondary"
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-white" />,
    title: "Pembebasan Setoran Otomatis",
    description: "Jika terjadi risiko tertentu pada pencari nafkah utama, setoran Anda akan dilanjutkan oleh sistem secara otomatis.",
    color: "bg-blue-500"
  },
  {
    icon: <HeartHandshake className="h-8 w-8 text-white" />,
    title: "Uang Pertanggungan Jiwa",
    description: "Perlindungan jiwa yang memberikan santunan kepada ahli waris sesuai nilai pertanggungan polis.",
    color: "bg-destructive"
  },
  {
    icon: <TreePine className="h-8 w-8 text-white" />,
    title: "Aset Bisnis Terwariskan",
    description: "Jaringan kemitraan yang Anda bangun dapat diwariskan sebagai aset produktif untuk generasi berikutnya.",
    color: "bg-primary"
  }
];

const RiskProtection = () => {
  return (
    <section className="bg-muted py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Perlindungan Risiko yang Menenangkan
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            FDPro hadir dengan lapisan perlindungan lengkap untuk memastikan keluarga Anda tetap aman dalam setiap situasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {protections.map((item, index) => (
            <Card key={index} className="bg-card shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 flex items-start gap-4">
                <div className={`rounded-full p-3 flex-shrink-0 ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">{item.title}</h3>
                  <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RiskProtection;