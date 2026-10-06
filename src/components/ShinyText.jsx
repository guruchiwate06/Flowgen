import React from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'framer-motion';

const ShinyText = ({ text, color = '#ffffff', shineColor = '#ffffff', speed = 3.5, spread = 90, className = "" }) => {
  const progress = useMotionValue(0);
  useAnimationFrame(time => {
    const p = (time / (speed * 1000)) % 1;
    progress.set(p * 100);
  });
  const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`);
  const gradientStyle = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 40%, ${shineColor} 50%, ${color} 60%, ${color} 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    display: 'inline-block'
  };
  return <motion.span className={className} style={{ ...gradientStyle, backgroundPosition }}>{text}</motion.span>;
};

export default ShinyText;
