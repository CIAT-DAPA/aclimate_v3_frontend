import type { LucideProps } from "lucide-react";
import React from "react";

interface FeatureCardProps {
  icon: React.ElementType<LucideProps>;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
      <div className="bg-blue-100 p-3 rounded-full mb-4">
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};

export default FeatureCard;
