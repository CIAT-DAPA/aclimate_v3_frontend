import Link from "next/link";
import Image from "next/image";

const Header = () => {
  return (
    <header className="bg-lime-950 shadow-sm">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/img/logo.png"
            alt="AClimate Logo"
            width={32}
            height={32}
          />
          <span className="text-xl font-bold text-white">AClimate</span>
        </Link>
        <div>
          <Link
            href="/estaciones"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Estaciones
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
