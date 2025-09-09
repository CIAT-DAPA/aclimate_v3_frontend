// app/components/ClimateChart.tsx
"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center">Cargando gráfica...</div>
});

interface DatasetConfig {
  label: string;
  color: string;
  data: number[];
  dates: string[];
}

interface ClimateChartProps {
  title: string;
  unit: string;
  datasets: DatasetConfig[];
  period: string;
  chartType?: "line" | "bar" | "area";
  description?: string; 
}

// Información de tooltip para cada variable climática
const variableInfo = {
  "Temperatura máxima": "La temperatura máxima representa el valor más alto de temperatura del aire en un día, medido en grados Celsius (°C).",
  "Precipitación": "La precipitación es la cantidad total de agua que cae sobre la superficie, medida en milímetros (mm). Incluye lluvia, nieve, granizo, etc.",
  "Temperatura mínima": "La temperatura mínima representa el valor más bajo de temperatura del aire en un día, medido en grados Celsius (°C).",
  "Radiación solar": "La radiación solar es la cantidad de energía radiante recibida del sol por unidad de área, medida en megajulios por metro cuadrado (MJ/m²)."
};

const ClimateChart: React.FC<ClimateChartProps> = ({ 
  title, 
  unit, 
  datasets, 
  period,
  chartType = "line",
  description
}) => {
  const isClimatology = period === "climatology";

  // Inicializar tooltips de Flowbite
  useEffect(() => {
    // Cargar e inicializar Flowbite solo en el cliente
    const initFlowbite = async () => {
      const { initTooltips } = await import('flowbite');
      initTooltips();
    };
    
    initFlowbite();
  }, []);

    // Obtener descripción para el tooltip
  const getTooltipContent = () => {
    if (description) return description;
    return variableInfo[title as keyof typeof variableInfo] || `Información sobre ${title.toLowerCase()}`;
  };

  const tooltipId = `tooltip-${title.replace(/\s+/g, '-').toLowerCase()}`;
  
  // Configuración de ApexCharts
  const chartOptions = {
    chart: {
      height: "100%",
      type: chartType,
      zoom: {
        enabled: !isClimatology
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    title: {
      text: title,
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 'bold'
      }
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      },
    },
    xaxis: {
      title: {
        text: isClimatology ? 'Meses' : 'Fecha'
      },
      ...(isClimatology ? {
        type: 'category' as const,
        categories: datasets[0]?.dates || []
      } : {
        type: 'datetime' as const,
        labels: {
          formatter: function(value: string) {
            try {
              return new Date(value).toLocaleDateString();
            } catch (e) {
              return value; // Si falla el parsing, devolver el valor original
            }
          }
        }
      })
    },
    yaxis: {
      title: {
        text: unit
      }
    },
    legend: {
      show: false
    },
    tooltip: {
      x: {
        formatter: function(value: any, { series, seriesIndex, dataPointIndex, w }: any) {
          if (isClimatology) {
            // Para climatología, mostrar directamente el nombre del mes
            return w.globals.categoryLabels[dataPointIndex];
          } else {
            // Para otros períodos, mostrar fecha formateada
            const date = new Date(value);
            return isNaN(date.getTime()) ? value : date.toLocaleDateString();
          }
        }
      },
      y: {
        formatter: function(val: number) {
          return val.toFixed(2) + " " + unit;
        }
      }
    }
  };

  const series = datasets.map(dataset => ({
    name: dataset.label,
    data: isClimatology 
      ? dataset.data 
      : dataset.dates.map((date, index) => ({
          x: date,
          y: dataset.data[index]
        })),
    color: dataset.color
  }));

  const hasData = datasets.some(dataset => dataset.data.length > 0);

  return (
    <div className="border border-gray-200 rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">

      <h3 className="font-medium text-lg text-gray-800">
        {title} <span className="text-gray-500 text-sm">({unit})</span>
      </h3>
      {/* Botón con tooltip */}
        <button 
          data-tooltip-target={tooltipId}
          data-tooltip-placement="right"
          type="button" 
          className="text-gray-400 hover:text-gray-600 transition-colors focus:ring-0 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        {/* Tooltip */}
        <div 
          id={tooltipId} 
          role="tooltip" 
          className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip"
        >
          {getTooltipContent()}
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      </div>
      
      {!hasData ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      ) : (
        <div className="flex-grow flex flex-col">
          <div className="flex flex-wrap gap-4 mb-4">
            {datasets.map((dataset, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: dataset.color }}
                ></div>
                <span className="text-sm">{dataset.label}</span>
              </div>
            ))}
          </div>
          
          <div className="flex-grow min-h-[300px]">
            <Chart 
              options={chartOptions} 
              series={series} 
              type={chartType} 
              height="100%"
              width="100%"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClimateChart;