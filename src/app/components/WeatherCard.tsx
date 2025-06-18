import { MapPin, Thermometer, CloudRain, Sun } from "lucide-react";

const WeatherCard = () => {
  return (
    <div className="relative overflow-hidden bg-[#283618] text-white p-6 rounded-2xl shadow-lg max-w-sm">
      <div className="absolute top-0 right-0 w-[200px] h-[120px] z-0">
        <svg
          className="absolute -top-5 -right-4"
          width="177"
          height="95"
          viewBox="0 0 355 190"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M385.398 12.4147L0 4.31812C14.6818 32.8181 56.8561 96.2594 104.446 99.3181C141.061 103.276 257.166 119.359 282.031 136.832C311.989 157.883 368.035 187.301 385.398 190V12.4147Z"
            fill="#364110"
          />
          <path
            d="M434.517 9.71582L444.503 158.963C357.599 136.832 302.812 121.449 256.932 89.3323C211.051 57.2158 149.787 82.0454 103.097 71.2499C65.7443 62.6135 54.0672 29.6874 52.8977 14.3039L434.517 9.71582Z"
            fill="#758D33"
          />
          <path
            d="M398.082 0H32.926C47.6078 28.5 146.458 41.7424 194.048 44.8011C230.663 48.7595 308.102 62.1818 324.943 84.2046C341.784 106.227 380.72 117.131 398.082 119.83V0Z"
            fill="#C0D259"
          />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg">Farallones</h3>
            <div className="flex items-center text-gray-300 text-sm gap-1">
              <MapPin size={14} />
              <span>Cali, Valle del Cauca</span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-300">
            <span>Jueves</span>
            <br />
            <span>2024/06/13</span>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-2">
            <Thermometer className="text-gray-400" />
            <span>24.0 °C - 33.7 °C</span>
          </div>
          <div className="flex items-center gap-2">
            <CloudRain className="text-gray-400" />
            <span>22.0 mm</span>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="text-gray-400" />
            <span>0.0 M/J</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
