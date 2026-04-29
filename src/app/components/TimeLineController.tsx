"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-timedimension";
//import "leaflet-timedimension/dist/leaflet.timedimension.control.css";
import { spatialService } from "@/app/services/spatialService";
import { useI18n } from "@/app/contexts/I18nContext";

interface TimelineControllerProps {
  dimensionName: string;
  layer: string;
  onTimeChange: (time: string) => void;
  wmsUrl: string;
  opacity?: number;
  displayFormat?: string;
  locale?: string;
  invalidDateLabel?: string;
}

// Personalizamos el formato de fecha
(L.Control as any).TimeDimensionCustom = (
  L.Control as any
).TimeDimension.extend({
  _getDisplayDateFormat: function (date: Date) {
    if (!date || isNaN(date.getTime())) {
      console.error("Invalid date:", date);
      return this.options.invalidDateLabel || "Invalid date";
    }

    const format = this.options.displayFormat || "YYYY-MM-DD";
    const localeTag = this.options.locale || "es-ES";
    const monthFormatter = new Intl.DateTimeFormat(localeTag, {
      month: "long",
      timeZone: "UTC",
    });

    const year = date.getUTCFullYear();
    const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
    const day = ("0" + date.getUTCDate()).slice(-2);

    if (format === "Month") {
      // Para indicadores hidrológicos, el año representa el mes (1=Enero, 2=Febrero, etc.)
      const monthIndex = Math.max(0, year - 1) % 12;
      return monthFormatter.format(new Date(Date.UTC(2000, monthIndex, 1)));
    }

    const monthName = monthFormatter.format(
      new Date(Date.UTC(year, date.getUTCMonth(), 1)),
    );

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
  locale,
  invalidDateLabel,
}) => {
  const map = useMap();
  const tdControlRef = useRef<any>(null);
  const tdLayerRef = useRef<any>(null);
  const tdInstanceRef = useRef<any>(null);
  const { locale: i18nLocale, t } = useI18n();
  const localeTag = locale || (i18nLocale === "es" ? "es-ES" : "en-US");
  const invalidLabel = invalidDateLabel || t("timeline.invalidDate");

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
        locale: localeTag,
        invalidDateLabel: invalidLabel,
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
  }, [
    map,
    dimensionName,
    layer,
    wmsUrl,
    onTimeChange,
    displayFormat,
    opacity,
    localeTag,
    invalidLabel,
  ]);

  return null;
};

export default TimelineController;
