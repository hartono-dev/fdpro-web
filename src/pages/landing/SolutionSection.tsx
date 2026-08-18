import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ShieldCheck, TrendingUp } from 'lucide-react';

const SolutionSection = () => {
  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800">
          Solusi FDPro: Kombinasi Tabungan Pendidikan Terproteksi & Peluang Bisnis Sampingan
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-blue-50 border-blue-200 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-xl font-bold text-primary">Program Tabungan Berproteksi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold">1</span>
                <div>
                  <p className="font-semibold text-gray-800">Pasti Aman</p>
                  <p className="text-sm text-gray-600">Dana pendidikan anak + pengembalian berkala</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold">2</span>
                <div>
                  <p className="font-semibold text-gray-800">Proteksi Keluarga</p>
                  <p className="text-sm text-gray-600">Bebas setoran jika musibah</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-teal-50 border-teal-200 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-teal-600" />
                <CardTitle className="text-xl font-bold text-primary">Hak Kemitraan Bisnis FDPro</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold">1</span>
                <div>
                  <p className="font-semibold text-gray-800">Potensi Income</p>
                  <p className="text-sm text-gray-600">Lisensi usaha & pendampingan</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold">2</span>
                <div>
                  <p className="font-semibold text-gray-800">Sistem Terpandu</p>
                  <p className="text-sm text-gray-600">Gunakan produk + materi promosi digital</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;