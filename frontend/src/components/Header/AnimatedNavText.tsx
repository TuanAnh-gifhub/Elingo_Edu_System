import { motion } from "framer-motion";
import ScrambleText from "./ScrambleText";

interface AnimatedNavTextProps {
  isActive: boolean;
  text: string;
  triggerKey?: unknown;
  className?: string;
}

const AnimatedNavText = ({ isActive, text, triggerKey, className = "text-xs" }: AnimatedNavTextProps) => {
  const animationConfig = {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
    transition: { duration: 0.25 },
  };

  const cornerStyle = { 
    fontWeight: 900, 
    fontSize: '2rem' 
  };

  if (!isActive) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className="relative">
      <motion.span
        {...animationConfig}
        className="absolute -left-2 -top-1 text-[#4da6ff] font-extrabold"
        style={cornerStyle}
      >
        ⌜
      </motion.span>
      <span className={`relative z-10 inline-block ${className}`}>
        <ScrambleText text={text} triggerKey={triggerKey} className="inline-block" />
      </span>
      <motion.span
        {...animationConfig}
        className="absolute -right-2 -bottom-1 text-[#4da6ff] font-extrabold"
        style={cornerStyle}
      >
        ⌟
      </motion.span>
    </span>
  );
};

export default AnimatedNavText;
