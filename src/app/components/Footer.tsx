import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-[#283618]">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-amber-50 text-xs sm:text-sm">Desarrollado por</span>
          <a 
            href="https://alliancebioversityciat.org/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image 
              src="/assets/img/partners/Alliance_white.png" 
              alt="Alliance Bioversity & CIAT" 
              width={120}
              height={40}
              className="h-8 sm:h-10 w-auto"
            />
          </a>
        </div>
        <div className="flex gap-2 sm:gap-4">
          <Link
            href="/about"
            className="text-amber-50 hover:text-amber-100 transition-colors text-xs sm:text-sm"
          >
            Socios
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
