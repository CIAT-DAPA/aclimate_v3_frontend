import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-[#283618]">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="text-amber-50 text-xs sm:text-sm">
          <div className="h-2 w-20 sm:w-24 bg-gray-200 rounded"></div>
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
