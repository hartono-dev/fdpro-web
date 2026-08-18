const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm text-gray-400">
          &copy; {currentYear} FDPro. All rights reserved.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          FDPro adalah platform akselerasi kemitraan yang bermitra dengan Perusahaan Asuransi Jiwa Nasional Terdaftar & Diawasi OJK.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          FDPro tidak menerima, menghimpun, atau mengelola dana nasabah. Seluruh setoran dikirim langsung ke Virtual Account Perusahaan Asuransi Mitra.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
