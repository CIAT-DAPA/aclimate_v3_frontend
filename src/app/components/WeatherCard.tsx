import { MapPin, Thermometer, CloudRain, Sun } from "lucide-react";

const WeatherCard = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">
            Estacion Farallones
          </h3>
          <div className="flex items-center text-gray-500 text-sm gap-1">
            <MapPin size={14} />
            <span>Cali, Colombia</span>
          </div>
        </div>
        <span className="text-gray-500 text-sm">
          Viernes
          <br />
          14/06/2025
        </span>
      </div>
      <div className="space-y-3 text-gray-700">
        <div className="flex items-center gap-2">
          <Thermometer className="text-blue-500" />
          <span>25°C - 29°C</span>
        </div>
        <div className="flex items-center gap-2">
          <CloudRain className="text-blue-500" />
          <span>15 mm</span>
        </div>
        <div className="flex items-center gap-2">
          <Sun className="text-yellow-500" />
          <span>0 MJ/J</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
