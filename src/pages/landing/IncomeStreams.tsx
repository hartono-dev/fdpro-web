import { Card, CardContent } from "@/components/ui/Card";
import { DollarSign, Award, Crown } from 'lucide-react';

const streams = [
  {
    icon: <DollarSign className="h-10 w-10 text-secondary" />,
    title: "Incentive Mitra Langsung",
    subtitle: "Direct Commission",
    description: "Komisi langsung dari setiap mitra yang Anda rekrut dan aktif menjalankan program."
  },
  {
    icon: <Award className="h-10 w-10 text-amber-500" />,
    title: "Bonus Pertumbuhan Mitra",
    subtitle: "Bonus Duplikasi Tim",
    description: "Apresiasi atas konsistensi pertumbuhan dan keaktifan portofolio jaringan mitra yang Anda bina secara langsung."
  },
  {
    icon: <Crown className="h-10 w-10 text-blue-500" />,
    title: "Royalti Pengembangan Tim",
    subtitle: "Overriding",
    description: "Royalti berjenjang dari seluruh kinerja tim di jaringan Anda, memberikan potensi passive income jangka panjang."
  }
];

const IncomeStreams = () => {
  return (
    <section className="bg-muted py-20 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
          3 Sumber Penghasilan dari Sistem Kemitraan FDPro
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Sistem kemitraan kami dirancang untuk memberikan multiple stream of income yang bisa Anda kembangkan dari rumah.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {streams.map((item) => (
            <Card key={item.title} className="bg-card shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-primary">{item.title}</h3>
                <p className="text-sm text-secondary font-medium mb-2">{item.subtitle}</p>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IncomeStreams;