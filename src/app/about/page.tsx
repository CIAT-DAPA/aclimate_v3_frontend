"use client";
import { useBranchConfig } from "@/app/configs";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function AboutPage() {
  const config = useBranchConfig();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (partnerName: string) => {
    setImageErrors(prev => new Set(prev).add(partnerName));
  };
  
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50">
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="text-center md:text-left">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 md:mb-8">
                  {config.displayName}
                </h2>
                {config.aboutUs.projectLink && (
                  <div className="mt-6 md:mt-8">
                    <Link
                      href={config.aboutUs.projectLink}
                      target="_blank"
                      className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 bg-white text-[#824b1a] border-2 border-[#bc6c25] font-semibold rounded-full hover:bg-[#bc6c25] hover:text-white transition-colors duration-300 text-sm md:text-base"
                    >
                      Conoce más del proyecto
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
              <div className="relative mt-8 md:mt-0">
                <div className="bg-gradient-to-br from-[#bc6c25]/10 to-[#dda15e]/10 rounded-2xl p-6 md:p-8 h-64 md:h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[#bc6c25] rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                      {config.aboutUs.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 px-2">
                      {config.aboutUs.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 md:mb-12 text-center">
              {config.aboutUs.partnersTitle}
            </h2>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              {config.aboutUs.partners.map((partner, index) => (
                <div key={index} className="group w-48 md:w-56 lg:w-64">
                  <Link
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 md:p-6 h-32 md:h-36 lg:h-40 flex items-center justify-center group-hover:scale-105">
                      <div className="relative w-full h-full">
                        {!imageErrors.has(partner.name) ? (
                          <Image
                            src={partner.logo}
                            alt={partner.alt}
                            fill
                            className="object-contain filter hover:brightness-110 transition-all duration-300"
                            sizes="(max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
                            onError={() => handleImageError(partner.name)}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-gray-100 rounded-lg">
                            <div className="text-center">
                              <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="text-xs text-gray-500">{partner.name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-center text-xs md:text-sm text-gray-600 mt-2 md:mt-3 font-medium">
                      {partner.name}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-gradient-to-r from-[#4b6d23] to-[#283618]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center text-white">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
              ¿Listo para explorar los datos climáticos?
            </h2>
            <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto px-4">
              Accede a información climática detallada y herramientas de análisis avanzadas
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 md:px-8 py-3 md:py-4 bg-[#bc6c25] text-white font-bold rounded-full hover:bg-[#a85a1f] transition-colors duration-300 text-base md:text-lg"
            >
              Comenzar ahora
              <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}