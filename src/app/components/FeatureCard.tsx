import type { LucideProps } from "lucide-react";
import React from "react";

interface FeatureCardProps {
  icon: React.ElementType<LucideProps>;
  title: string;
  description: string;
  bg?: boolean;
}

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  bg,
}: FeatureCardProps) => {
  return (
    <div
      className={`${
        bg ? "bg-[#dce1c8]" : "bg-white"
      } py-10 px-4 flex flex-col items-center text-center`}
    >
      <Icon className="h-8 w-8 text-[#283618] mb-2" />
      <h3 className="text-lg font-bold text-[#283618] mb-2">{title}</h3>
      <p className="text-[#283618] text-sm">{description}</p>
    </div>
  );
};

export default FeatureCard;
