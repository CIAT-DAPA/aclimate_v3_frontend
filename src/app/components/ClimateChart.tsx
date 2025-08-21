// app/components/ClimateChart.tsx
"use client";

import React from "react";
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
}

const ClimateChart: React.FC<ClimateChartProps> = ({ 
  title, 
  unit, 
  datasets, 
  period,
  chartType = "line"
}) => {
  const isClimatology = period === "climatology";
  
  // Configuración de ApexCharts
  const chartOptions = {
    chart: {
      height: "100%",
      type: chartType,
      zoom: {
        enabled: !isClimatology // Deshabilitar zoom en climatología
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
      curve: 'smooth'
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
      // Configuración especial para climatología
      ...(isClimatology ? {
        type: 'category' as const,
        categories: datasets[0]?.dates || []
      } : {
        type: 'datetime' as const,
        labels: {
          formatter: function(value: string) {
            return new Date(value).toLocaleDateString();
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
      // Tooltip especial para climatología
      ...(isClimatology ? {
        x: {
          show: true,
          formatter: undefined
        }
      } : {
        x: {
          formatter: function(value: string) {
            return new Date(value).toLocaleDateString();
          }
        }
      }),
      y: {
        formatter: function(val: number) {
          return val.toFixed(2) + " " + unit;
        }
      }
    }
  };

  const series = datasets.map(dataset => ({
    name: dataset.label,
    // Formato diferente para climatología
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
      <h3 className="font-medium text-lg text-gray-800 mb-4">
        {title} <span className="text-gray-500 text-sm">({unit})</span>
      </h3>
      
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