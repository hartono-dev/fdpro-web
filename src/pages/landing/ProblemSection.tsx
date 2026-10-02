import { Card, CardContent } from "@/components/ui/Card";
import { Briefcase, Home, Factory, UserCheck } from 'lucide-react';

const personas = [
  {
    icon: <Briefcase className="h-10 w-10 text-amber-500" />,
    title: "💼 Karyawan & Profesional",
    points: [
      "Gaji stagnan, khawatir masa depan finansial",
      "Tak ada waktu untuk bisnis konvensional rumit",
      "Butuh solusi income kedua tanpa tinggalkan pekerjaan"
    ]
  },
  {
    icon: <Home className="h-10 w-10 text-secondary" />,
    title: "🏠 Ibu Rumah Tangga",
    points: [
      "Ingin bantu ekonomi keluarga dari rumah",
      "Terhalang waktu ngurus anak",
      "Butuh komunitas & bimbingan dari nol"
    ]
  },
  {
    icon: <Factory className="h-10 w-10 text-blue-500" />,
    title: "🏭 Pengusaha & UKM",
    points: [
      "Cash flow lambat, bisnis tergantung fisik",
      "Butuh diversifikasi income yang stabil",
      "Mencari sistem yang mudah diduplikasi"
    ]
  },
    {
    icon: <UserCheck className="h-10 w-10 text-emerald-500" />,
    title: "👴 Karyawan Pra-Pensiun",
    points: [
      "Khawatir penurunan tingkat penghasilan saat pensiun.",
      "Ingin aset bisnis aman, stabil, tanpa risiko modal besar.",
      "Mencari kegiatan produktif fleksibel & dapat diwariskan."
    ]
  }
];

const ProblemSection = () => {
  return (
    <section className="bg-muted py-20 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 break-words">
          Lagi Cari Bisnis Sampingan Sekaligus Cara Amankan Masa Depan Finansial Keluarga?
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
          {personas.map((item) => (
            <Card key={item.title} className="bg-card shadow-lg border-t-4 border-secondary flex flex-col">
              <CardContent className="p-6 flex-grow flex flex-col">
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-primary mb-3">{item.title}</h3>
                <ul className="space-y-2 text-gray-700 flex-grow">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="text-secondary mt-1">✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;