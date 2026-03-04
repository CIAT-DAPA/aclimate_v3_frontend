"use client";

import {
  Map,
  MapPinned,
  FileText,
  Waves,
  Droplets,
  CloudRain,
  ThermometerSun,
  Leaf,
  Home,
} from "lucide-react";
import React, { useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import MapComponent from "../components/MapComponent";

export default function ScenarioPage() {
  const contentRef = useRef<HTMLDivElement>(null);

  const downloadPdf = useCallback(() => {
    if (contentRef.current === null) {
      return;
    }

    // Capturamos el contenido.
    // Usamos el mismo color del fondo de la página bg-zinc-50 => #fafafa (Tailwind zinc-50 generalmente, o muy cercano)
    toPng(contentRef.current, { cacheBust: true, backgroundColor: "#fafafa" })
      .then((dataUrl) => {
        // Crear una imagen temporal para obtener las dimensiones reales
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          // Conversión aproximada px -> mm (a 96 DPI: 1px = 0.264583 mm)
          const pdfWidth = img.width * 0.264583;
          const pdfHeight = img.height * 0.264583;

          // Crear PDF con las dimensiones exactas del contenido (ancho x alto)
          const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? "l" : "p",
            unit: "mm",
            format: [pdfWidth, pdfHeight],
          });

          pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save("escenario_climatico.pdf");
        };
      })
      .catch((err) => {
        console.error("Error generating PDF", err);
      });
  }, []);

  return (
    <div className="min-h-[calc(100vh-theme(spacing.16))] bg-zinc-50 dark:bg-zinc-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 pb-20">
        <div
          ref={contentRef}
          className="max-w-4xl mx-auto flex flex-col gap-12 p-4"
        >
          {/* Header Section */}
          <div className="border-l-4 border-[#c86b24] pl-5 sm:pl-8 bg-white p-6 rounded-lg shadow-sm">
            <div>
              <h1 className="text-3xl font-semibold text-[#283618] mb-2">
                Escenarios Climáticos
              </h1>
              <p className="text-gray-600 text-lg">
                Haz click en un lugar de interés para conocer las
                características y recomendaciones de la zona
              </p>
            </div>

            {/* Map Section Mockup */}
            <div className="mt-6 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden relative">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Map className="text-blue-600" size={24} />
                <h2 className="text-xl font-medium text-gray-800">
                  Sequia moderada
                </h2>
              </div>

              <div className="relative w-full h-[400px] bg-sky-50 flex items-center justify-center overflow-hidden">
                {/* Using a placeholder for the map image */}
                <MapComponent />
                <div className="absolute inset-0 bg-[#fef1e4] opacity-50"></div>
              </div>

              <div className="p-4 flex gap-4 md:gap-8 items-center bg-gray-50 text-sm">
                <div className="flex items-center gap-2 font-medium text-gray-700">
                  <Map size={20} className="text-gray-800" />
                  <span>Escenarios</span>
                </div>
                <div className="flex gap-4 items-center text-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-4 bg-red-600 rounded-sm inline-block"></span>
                    <span>Verano</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-4 bg-lime-200 rounded-sm inline-block"></span>
                    <span>Normal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-4 bg-blue-600 rounded-sm inline-block"></span>
                    <span>Invierno</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Characteristics Section */}
          <div className="border-l-4 border-[#283618] pl-5 sm:pl-8 bg-white p-6 rounded-lg shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-[#283618] mb-4">
                Caracteristicas de la sequia moderada
              </h2>
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold text-gray-700 w-1/4">
                        Categoría
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-700 w-3/4">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-600">
                    <tr>
                      <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-800">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Waves size={24} strokeWidth={1.5} />
                        </div>
                        Rios
                      </td>
                      <td className="px-6 py-4">
                        Los ríos, caños y quebradas bajan su nivel. Se dificulta
                        el acceso al agua para beber y para las labores de la
                        finca.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-800">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Droplets size={24} strokeWidth={1.5} />
                        </div>
                        Falta de lluvia
                      </td>
                      <td className="px-6 py-4">
                        Las lluvias han sido pocas, no es suficiente para que
                        las semillas germinen bien y que las plantas crezcan con
                        fuerza, o para que haya suficiente pasto para los
                        animales.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-800">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <CloudRain size={24} strokeWidth={1.5} />
                        </div>
                        Tierra muy húmeda en algunas zonas
                      </td>
                      <td className="px-6 py-4">
                        Aunque en general hay sequía, y se requiere agua, el
                        exceso de lluvias puede pudrir las raíces.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-800">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <ThermometerSun size={24} strokeWidth={1.5} />
                        </div>
                        Calor fuerte
                      </td>
                      <td className="px-6 py-4">
                        Los días están más calientes y secos de lo normal,
                        afectando a los animales y a las plantas, por la falta
                        de agua y secamieno de ríos.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-800">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Leaf size={24} strokeWidth={1.5} />
                        </div>
                        Cultivo
                      </td>
                      <td className="px-6 py-4">
                        Algunos cultivos tradicionales pueden crecer más
                        despacio, o dar menos fruto, o secarse.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-800">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Home size={24} strokeWidth={1.5} />
                        </div>
                        Alimentación
                      </td>
                      <td className="px-6 py-4">
                        Con menos cosecha y animales produciendo menos, se
                        afecta especialmente la alimentación de la familia.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          <div className="border-l-4 border-[#c86b24] pl-5 sm:pl-8 relative bg-white p-6 rounded-lg shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-[#283618] mb-1">
                Recomendaciones para la sequia moderada
              </h2>
              <p className="text-gray-600 mb-4">
                Basadas en escenarios climáticos y probabilidades de
                precipitación
              </p>
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold text-gray-700 w-1/3">
                        Recomendación
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-700 w-2/3">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-600">
                    <tr>
                      <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-800">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Droplets size={24} strokeWidth={1.5} />
                        </div>
                        Cuidemos el agua disponible
                      </td>
                      <td className="px-6 py-4">
                        Guardar el agua lluvia en tanques limpios tapados,
                        Proteger los nacimientos de agua para evitar que se
                        sequen más.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-800">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Leaf size={24} strokeWidth={1.5} />
                        </div>
                        Sembrar lo que resiste la sequía
                      </td>
                      <td className="px-6 py-4">
                        Priorizar cultivos que necesiten menos agua. Usar
                        coberturas naturales en el suelo para guardar humedad
                        por cuando llueva.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-800">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <ThermometerSun size={24} strokeWidth={1.5} />
                        </div>
                        Protegerse del calor
                      </td>
                      <td className="px-6 py-4">
                        Evitar trabajos fuertes bajo el sol directo. Tomar agua
                        frecuentemente. Poner mas sombra a los animales.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={downloadPdf}
        className="fixed bottom-8 right-8 bg-[#c86b24] hover:bg-[#a6561b] text-white p-4 rounded-full shadow-lg transition-all border-4 border-white z-50 cursor-pointer hover:scale-110 active:scale-95"
        title="Descargar reporte en PDF"
      >
        <FileText size={28} />
      </button>
    </div>
  );
}
