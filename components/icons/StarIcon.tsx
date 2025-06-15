
import React from 'react';

interface StarIconProps {
  filled: boolean;
  className?: string;
}

const StarIcon: React.FC<StarIconProps> = ({ filled, className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled? 0 : 1.5}
      className={className || "w-6 h-6"}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.321h5.385a.562.562 0 01.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.82.61l-4.725-3.248a.563.563 0 00-.65 0l-4.725 3.248a.562.562 0 01-.82-.61l1.285-5.385a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988h5.385a.563.563 0 00.475-.321l2.125-5.111z"
      />
    </svg>
  );
};

export default StarIcon;
