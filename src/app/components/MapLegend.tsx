// app/components/MapLegend.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapLegendProps {
  wmsUrl: string;
  layerName: string;
  position?: "bottomright" | "bottomleft" | "topright" | "topleft";
  time?: string;
}

const MapLegend: React.FC<MapLegendProps> = ({
  wmsUrl,
  layerName,
  position = "bottomright",
  time
}) => {
  const map = useMap();
  const [legendUrl, setLegendUrl] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(true);

  useEffect(() => {
    if (!wmsUrl || !layerName) return;

    const params = new URLSearchParams({
      SERVICE: "WMS",
      VERSION: "1.3.0",
      REQUEST: "GetLegendGraphic",
      FORMAT: "image/png",
      LAYER: layerName,
      WIDTH: "20",
      HEIGHT: "20",
      TRANSPARENT: "true",
      LEGEND_OPTIONS: "fontName:Helvetica;fontSize:12;fontColor:0x000000;bgColor:0xFFFFFF;dpi:90"
    });

    if (time) {
      params.set("TIME", time);
    }

    const url = `${wmsUrl}?${params.toString()}`;
    setLegendUrl(url);
  }, [wmsUrl, layerName, time]);

  if (!legendUrl) return null;

  return (
    <div className={`leaflet-${position}`}>
      <div className="leaflet-control leaflet-bar">
        <div className="bg-white p-2 rounded shadow-md max-w-[200px]">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm">Leyenda</h4>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isOpen ? " −" : " +"}
            </button>
          </div>
          {isOpen && (
            <div
              className="legend-content"
              style={{ maxHeight: "230px", overflowY: "auto", cursor: "grab" }}
              onMouseDown={e => {
                e.stopPropagation();
                e.preventDefault();

                // Deshabilita el drag del mapa
                if (map && map.dragging) map.dragging.disable();

                const el = e.currentTarget;
                let startY = e.pageY;
                let startScroll = el.scrollTop;
                const onMouseMove = (moveEvent: MouseEvent) => {
                  el.scrollTop = startScroll - (moveEvent.pageY - startY);
                };
                const onMouseUp = () => {
                  window.removeEventListener("mousemove", onMouseMove);
                  window.removeEventListener("mouseup", onMouseUp);
                  el.style.cursor = "grab";
                  // Habilita el drag del mapa nuevamente
                  if (map && map.dragging) map.dragging.enable();
                };
                window.addEventListener("mousemove", onMouseMove);
                window.addEventListener("mouseup", onMouseUp);
                el.style.cursor = "grabbing";
              }}
            >
              <img
                src={legendUrl}
                alt="Leyenda"
                className="max-w-full h-auto"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapLegend;