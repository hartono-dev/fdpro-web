import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 h-14 md:h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center">
          <img
            src="/FDPro_logo_Landscape.svg"
            alt="FDPro"
            className="h-7 md:h-8 w-auto"
          />
        </div>
        <Link to="/member">
          <Button variant="outline" size="sm" className="text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 h-auto">
            Member Login
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
