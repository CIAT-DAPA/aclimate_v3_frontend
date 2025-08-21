// TimelineController.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-timedimension";
import "leaflet-timedimension/dist/leaflet.timedimension.control.css";
import { spatialService } from "@/app/services/spatialService";

interface TimelineControllerProps {
  dimensionName: string;
  layer: string;
  onTimeChange: (time: string) => void;
  wmsUrl: string;
}

// Extender el control de TimeDimension para personalizar el formato de fecha
(L.Control as any).TimeDimensionCustom = L.Control.TimeDimension.extend({
  _getDisplayDateFormat: function (date: Date) {
    if (!date || isNaN(date.getTime())) {
      console.error("Invalid date:", date);
      return "Invalid date";
    }
    return date.toISOString().split("T")[0];
  },
});

const TimelineController: React.FC<TimelineControllerProps> = ({
  dimensionName,
  layer,
  onTimeChange,
  wmsUrl
}) => {
  const map = useMap();
  const timeDimensionControlRef = useRef<any>(null);
  const wmsLayerRef = useRef<any>(null);
  const timeDimensionRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Initializing TimelineController for layer:", layer);
    
    let isMounted = true;

    const initializeTimeline = async () => {
      try {
        setIsLoading(true);
        const dates = await spatialService.getDatesFromGeoserver(wmsUrl, layer);
        console.log("Fechas obtenidas:", dates);
        
        if (!isMounted) return;
        
        if (dates.length === 0) {
          console.error("No dates found for layer:", layer);
          setIsLoading(false);
          return;
        }

        // Convertir fechas a timestamps y validarlas
        const validTimes = dates
          .map(date => {
            const timestamp = new Date(date).getTime();
            return isNaN(timestamp) ? null : timestamp;
          })
          .filter(timestamp => timestamp !== null) as number[];

        if (validTimes.length === 0) {
          console.error("No valid dates found for layer:", layer);
          setIsLoading(false);
          return;
        }

        // Configurar la dimensión de tiempo
        const timeDimension = new (L as any).TimeDimension({
          times: validTimes,
          currentTime: validTimes[0],
        });
        
        timeDimensionRef.current = timeDimension;
        (map as any).timeDimension = timeDimension;

        // Crear la capa WMS
        const wmsLayer = (L.tileLayer as any).wms(wmsUrl, {
          layers: layer,
          format: "image/png",
          transparent: true,
          crs: L.CRS.EPSG4326,
        });

        // Crear la capa con dimensión temporal
        const tdWmsLayer = (L as any).timeDimension.layer.wms(wmsLayer, {
          timeDimension: timeDimension,
          updateTimeDimension: true,
          timeDimensionName: dimensionName,
        });
        
        tdWmsLayer.addTo(map);
        wmsLayerRef.current = tdWmsLayer;

        // Crear el control de línea de tiempo
        const timeDimensionControl = new (L.Control as any).TimeDimensionCustom({
          timeDimension: timeDimension,
          position: "bottomleft",
          autoPlay: false,
          timeSliderDragUpdate: true,
          speedSlider: false,
          playerOptions: {
            transitionTime: 250,
            loop: false,
            startOver: false,
          },
        });
        
        map.addControl(timeDimensionControl);
        timeDimensionControlRef.current = timeDimensionControl;

        // Configurar el evento de cambio de tiempo
        const handleTimeChangeEvent = (e: any) => {
          const currentTime = timeDimension.getCurrentTime();
          if (currentTime && !isNaN(currentTime)) {
            const formattedTime = new Date(currentTime).toISOString().split("T")[0];
            console.log("Time changed to:", formattedTime);
            onTimeChange(formattedTime);
          } else {
            console.warn("Invalid time value:", currentTime);
          }
        };

        timeDimension.on("timeload", handleTimeChangeEvent);
        timeDimension.on("timechange", handleTimeChangeEvent);

        // Establecer el tiempo inicial
        const initialTime = timeDimension.getCurrentTime();
        if (initialTime && !isNaN(initialTime)) {
          const initialFormattedTime = new Date(initialTime).toISOString().split("T")[0];
          onTimeChange(initialFormattedTime);
        }

        console.log("TimelineController initialized successfully");
        setIsLoading(false);

      } catch (error) {
        console.error("Error initializing TimelineController:", error);
        if (isMounted) setIsLoading(false);
      }
    };

    initializeTimeline();

    // Cleanup function
    return () => {
      isMounted = false;
      console.log("Cleaning up TimelineController");
      try {
        if (wmsLayerRef.current) {
          map.removeLayer(wmsLayerRef.current);
        }
        if (timeDimensionControlRef.current) {
          map.removeControl(timeDimensionControlRef.current);
        }
        if ((map as any).timeDimension) {
          delete (map as any).timeDimension;
        }
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    };
  }, [map, layer, onTimeChange, wmsUrl, dimensionName]);

  return null;
};

export default TimelineController;