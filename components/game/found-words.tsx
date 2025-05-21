import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface FoundWordsProps {
  words: string[];
}

export function FoundWords({ words }: FoundWordsProps) {
  const [latestWord, setLatestWord] = useState<string | null>(null);
  
  useEffect(() => {
    // Animate the latest found word
    if (words.length > 0) {
      const newest = words[words.length - 1];
      setLatestWord(newest);
      
      const timer = setTimeout(() => {
        setLatestWord(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [words]);

  if (words.length === 0) {
    return null;
  }

  return (
    <div className="text-center mb-6 transition-all">
      {words.map((word, index) => (
        <Badge
          key={word}
          className={`inline-block bg-accent/20 backdrop-blur-sm rounded-full py-1 px-6 mb-1 mx-1 transition-all ${
            word === latestWord 
              ? "animate-bounce bg-accent text-accent-foreground" 
              : ""
          }`}
        >
          <p className="text-lg font-bold">{word}</p>
        </Badge>
      ))}
    </div>
  );
}
