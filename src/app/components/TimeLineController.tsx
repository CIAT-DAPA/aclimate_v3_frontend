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
}

// Personalizamos el formato de fecha
L.Control.TimeDimensionCustom = L.Control.TimeDimension.extend({
  _getDisplayDateFormat: function (date: Date) {
    if (!date || isNaN(date.getTime())) {
      console.error("Invalid date:", date);
      return "Invalid date";
    }
    return (
      date.getUTCFullYear() +
      "-" +
      ("0" + (date.getUTCMonth() + 1)).slice(-2) +
      "-" +
      ("0" + date.getUTCDate()).slice(-2)
    );
  },
});

const TimelineController: React.FC<TimelineControllerProps> = ({
  dimensionName,
  layer,
  onTimeChange,
  wmsUrl,
  opacity = 1.0
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

      // Crear instancia independiente de TimeDimension
      const timeDimension = new L.TimeDimension({
        times: dates,
        currentTime: dates[dates.length - 1],
      });
      tdInstanceRef.current = timeDimension;

      // Crear capa WMS con soporte de timeDimension local
      const baseWms = (L.tileLayer as any).wms(wmsUrl, {
        layers: layer,
        format: "image/png",
        transparent: true,
        crs: L.CRS.EPSG4326,
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
      const initialTime = new Date(timeDimension.getCurrentTime()).toISOString().split("T")[0];
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
