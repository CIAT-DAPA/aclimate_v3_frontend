"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const MapSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="absolute top-4 left-2 right-2 sm:left-4 sm:right-4 z-[1000] max-w-xs sm:max-w-md ">
      <div className="bg-white rounded-lg shadow-lg p-3 mb-2">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar ubicación o estación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
          />
        </div>
      </div>
    </div>
  );
};

export default MapSearch;
