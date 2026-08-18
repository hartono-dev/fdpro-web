import { useState } from "react";
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Apakah uang Rp30.000/hari saya akan hilang jika tidak berhasil merekrut orang?",
    answer: "Tidak. Dana Rp30.000/hari Anda adalah setoran untuk Program Tabungan Berproteksi yang masuk ke Virtual Account resmi perusahaan asuransi mitra OJK. Dana ini adalah premi asuransi yang memberikan Anda nilai tunai dan perlindungan jiwa—bukan biaya program atau biaya rekrutmen. Terlepas dari keberhasilan Anda dalam kemitraan, nilai tunai dari polis tabungan tetap menjadi milik Anda."
  },
  {
    question: "Apakah FDPro ini skema MLM, Ponzi, atau Money Game?",
    answer: "Tidak. FDPro bukan MLM, Ponzi, atau Money Game. FDPro adalah program kemitraan yang menggabungkan produk Tabungan Pendidikan Terproteksi dari perusahaan asuransi resmi terdaftar OJK dengan hak akses sistem duplikasi bisnis. Seluruh setoran nasabah 100% dikelola oleh perusahaan asuransi mitra—bukan oleh FDPro. Tidak ada perputaran uang antar member. Sistem komisi FDPro berasal dari biaya akuisisi yang sah dan transparan."
  },
  {
    question: "Saya sangat sibuk. Berapa jam waktu yang dibutuhkan sehari?",
    answer: "FDPro dirancang khusus untuk orang sibuk. Anda hanya perlu meluangkan sekitar 30-60 menit per hari untuk mempelajari materi, berbagi informasi dengan rekan terdekat, dan memantau perkembangan tim melalui platform digital kami. Tidak perlu meninggalkan pekerjaan utama, tidak perlu jualan produk fisik, dan tidak perlu menghadiri pertemuan rutin yang menyita waktu."
  },
  {
    question: "Bagaimana jika saya tidak pandai berjualan?",
    answer: "Anda tidak perlu menjadi sales untuk sukses di FDPro. Cukup bagikan pengalaman pribadi Anda tentang pentingnya melindungi masa depan pendidikan anak kepada 5 orang terdekat. FDPro menyediakan materi promosi digital, sistem, dan bimbingan komunitas yang akan memandu Anda langkah demi langkah. Banyak mitra kami yang awalnya mengaku 'gagap jualan' kini berhasil membangun tim yang solid."
  },
  {
    question: "Ke mana pembayaran setoran harian saya dikirimkan?",
    answer: "Setiap setoran harian Rp30.000 Anda dikirimkan langsung ke Virtual Account (VA) resmi perusahaan asuransi jiwa nasional mitra FDPro yang terdaftar dan diawasi oleh OJK (Otoritas Jasa Keuangan). FDPro tidak pernah menerima, memegang, atau mengelola uang setoran nasabah. Bukti setoran dan hak polis resmi akan diterbitkan atas nama Anda langsung oleh perusahaan asuransi."
  }
];

const AccordionItem = ({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-primary pr-4">{item.question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
          {item.answer}
        </div>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-muted py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4">
          Pertanyaan yang Sering Diajukan
        </h2>
        <p className="text-lg text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Masih ragu? Temukan jawaban untuk pertanyaan yang paling sering ditanyakan.
        </p>
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <AccordionItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;