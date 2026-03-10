import { useState, useEffect } from "react";

interface ScrambleTextProps {
  text: string;
  triggerKey?: unknown;
  duration?: number;
  interval?: number;
  className?: string;
}

const ScrambleText = ({ 
  text, 
  triggerKey, 
  duration = 400, 
  interval = 30, 
  className = "" 
}: ScrambleTextProps) => {
  const [display, setDisplay] = useState(text);
  
  useEffect(() => {
    let mounted = true;
    let frame = 0;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=<>?";
    const textArr = text.split("");
    let revealCount = 0;
    
    setDisplay(textArr.map(() => "").join(""));
    
    const totalFrames = Math.ceil(duration / interval);
    
    const scramble = () => {
      if (!mounted) return;
      
      if (frame < totalFrames) {
        revealCount = Math.floor((frame / totalFrames) * textArr.length);
        const scrambled = textArr.map((c, i) => {
          if (i < revealCount) return c;
          if (c === " ") return " ";
          return chars[Math.floor(Math.random() * chars.length)];
        });
        setDisplay(scrambled.join(""));
        frame++;
        setTimeout(scramble, interval);
      } else {
        setDisplay(text);
      }
    };
    
    scramble();
    
    return () => { 
      mounted = false; 
    };
  }, [triggerKey, text, duration, interval]);
  
  return <span className={className}>{display}</span>;
};

export default ScrambleText;
