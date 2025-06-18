import { Waves } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white mt-12">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-gray-500 text-sm">
          <div className="h-2 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="flex gap-4">
          <Waves className="text-gray-300" />
          <Waves className="text-gray-300" />
          <Waves className="text-gray-300" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
