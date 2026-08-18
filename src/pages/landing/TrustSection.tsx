import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Building, Users } from 'lucide-react';

const TrustSection = () => {
  return (
    <section className="bg-gray-50 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800">
          Keamanan Dana Anda Adalah Prioritas Utama Kami
        </h2>
        <p className="mt-4 text-lg text-center text-gray-600 max-w-3xl mx-auto">
          FDPro menerapkan pemisahan peran yang jelas untuk melindungi setiap rupiah yang Anda setorkan.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-l-4 border-blue-600 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-lg font-bold text-primary">Pengelola Dana</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-blue-700 mb-3">Perusahaan Asuransi Mitra</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  100% Setoran ke VA Resmi Perusahaan Asuransi Terdaftar OJK
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  Hak polis resmi atas nama pengguna
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  FDPro TIDAK memegang uang premi
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-teal-600 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-teal-600" />
                <CardTitle className="text-lg font-bold text-primary">Akselerator Bisnis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-teal-700 mb-3">FDPro Support System</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  Menyediakan platform edukasi
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  Materi promosi digital
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  Bimbingan komunitas dan sistem duplikasi
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;