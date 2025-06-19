import Link from "next/link";
import Image from "next/image";

const Header = () => {
  return (
    <header className="bg-[#283618] shadow-sm">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/img/logo.png"
            alt="AClimate Logo"
            width={32}
            height={32}
          />
          <span className="text-xl font-normal text-amber-50">AClimate</span>
        </Link>
        <div>
          <Link
            href="/locations"
            className="text-amber-50 hover:text-amber-100 transition-colors"
          >
            Estaciones
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
