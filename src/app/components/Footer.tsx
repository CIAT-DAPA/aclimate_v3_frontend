import { Waves } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#283618]">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-amber-50 text-sm">
          <div className="h-2 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="flex gap-4">
          <Waves className="text-amber-50" />
          <Waves className="text-amber-50" />
          <Waves className="text-amber-50" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
