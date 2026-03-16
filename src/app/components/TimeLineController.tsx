"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-timedimension";
//import "leaflet-timedimension/dist/leaflet.timedimension.control.css";
import { spatialService } from "@/app/services/spatialService";

interface TimelineControllerProps {
  dimensionName: string;
  layer: string;
  onTimeChange: (time: string) => void;
  wmsUrl: string;
  opacity?: number;
  displayFormat?: string;
}

// Personalizamos el formato de fecha
(L.Control as any).TimeDimensionCustom = (
  L.Control as any
).TimeDimension.extend({
  _getDisplayDateFormat: function (date: Date) {
    if (!date || isNaN(date.getTime())) {
      console.error("Invalid date:", date);
      return "Invalid date";
    }

    const format = this.options.displayFormat || "YYYY-MM-DD";

    // Obtener nombre del mes en español
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const year = date.getUTCFullYear();
    const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
    const day = ("0" + date.getUTCDate()).slice(-2);

    if (format === "Month") {
      // Para indicadores hidrológicos, el año representa el mes (1=Enero, 2=Febrero, etc.)
      const monthIndex = Math.max(0, year - 1) % 12;
      return monthNames[monthIndex];
    }

    const monthName = monthNames[date.getUTCMonth()];

    if (format === "YYYY") return year.toString();
    if (format === "MM") return month;
    if (format === "YYYY-MM") return `${year}-${month}`;
    if (format === "YYYY-Month") return `${monthName} ${year}`;

    return `${year}-${month}-${day}`;
  },
});

const TimelineController: React.FC<TimelineControllerProps> = ({
  dimensionName,
  layer,
  onTimeChange,
  wmsUrl,
  opacity = 1.0,
  displayFormat = "YYYY-MM-DD",
}) => {
  const map = useMap();
  const tdControlRef = useRef<any>(null);
  const tdLayerRef = useRef<any>(null);
  const tdInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const dates = await spatialService.getDatesFromGeoserver(wmsUrl, layer);
      if (!isMounted || !dates || dates.length === 0) return;

      // Convertir la fecha más reciente a timestamp para asegurar que TimeDimension inicie en el último dato
      const lastDate = dates[dates.length - 1];
      const currentTimeTs = new Date(lastDate).getTime();

      // Crear instancia independiente de TimeDimension
      const timeDimension = new (L as any).TimeDimension({
        times: dates,
        currentTime: currentTimeTs,
      });
      tdInstanceRef.current = timeDimension;

      // Crear capa WMS con soporte de timeDimension local
      const baseWms = (L.tileLayer as any).wms(wmsUrl, {
        layers: layer,
        format: "image/png",
        transparent: true,
        version: "1.3.0",
        opacity: opacity,
      });

      const tdWmsLayer = (L as any).timeDimension.layer.wms(baseWms, {
        timeDimension: timeDimension,
        timeDimensionName: dimensionName,
      });
      tdWmsLayer.addTo(map);
      tdLayerRef.current = tdWmsLayer;

      // Crear control independiente y añadirlo al mapa
      const tdControl = new (L.Control as any).TimeDimensionCustom({
        timeDimension: timeDimension,
        position: "bottomright",
        autoPlay: false,
        speedSlider: false,
        displayFormat: displayFormat, // Pass format to control
        playerOptions: {
          buffer: 1,
          minBufferReady: -1,
          transitionTime: 250,
          loop: false,
          startOver: false,
        },
      });
      map.addControl(tdControl);
      tdControlRef.current = tdControl;

      // Notificar tiempo inicial
      const initialTime = new Date(timeDimension.getCurrentTime())
        .toISOString()
        .split("T")[0];
      onTimeChange(initialTime);

      timeDimension.on("timechange", () => {
        const currentTime = new Date(timeDimension.getCurrentTime())
          .toISOString()
          .split("T")[0];
        onTimeChange(currentTime);
      });
    };

    initialize();

    return () => {
      isMounted = false;
      try {
        if (tdLayerRef.current) map.removeLayer(tdLayerRef.current);
        if (tdControlRef.current) map.removeControl(tdControlRef.current);
        tdInstanceRef.current = null;
      } catch (e) {
        console.error("Error cleaning up timeline:", e);
      }
    };
  }, [map, dimensionName, layer, wmsUrl, onTimeChange]);

  return null;
};

export default TimelineController;
