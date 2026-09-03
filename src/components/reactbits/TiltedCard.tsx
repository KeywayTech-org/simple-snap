import React, { useRef, useState } from 'react';
import { motion, useSpring } from 'motion/react';

interface TiltedCardProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  maxAngle?: number;
  scaleOnHover?: number;
}

export const TiltedCard: React.FC<TiltedCardProps> = ({
  children,
  className = '',
  containerClassName = '',
  maxAngle = 10,
  scaleOnHover = 1.02,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 150, damping: 20 });
  const scale = useSpring(1, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    rotateX.set(-mouseY * maxAngle);
    rotateY.set(mouseX * maxAngle);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    scale.set(scaleOnHover);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  return (
    <div
      ref={ref}
      className={`[perspective:1000px] ${containerClassName}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: 'preserve-3d',
        }}
        className={`w-full h-full transition-shadow duration-300 ${
          isHovered ? 'shadow-2xl shadow-amber-500/10' : ''
        } ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
};
