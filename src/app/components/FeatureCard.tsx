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
      style={{
        backgroundColor: bg ? "var(--color-quaternary)" : "white",
      }}
      className="py-10 px-4 flex flex-col items-center text-center"
    >
      <Icon
        className="h-8 w-8 mb-2"
        style={{ color: "var(--color-primary)" }}
      />
      <h3
        className="text-lg font-bold mb-2 text-balance"
        style={{ color: "var(--color-primary)" }}
      >
        {title}
      </h3>
      <p
        className="text-base font-medium text-pretty"
        style={{ color: "var(--color-text-dark)" }}
      >
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;