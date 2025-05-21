import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Lightbulb, Users } from "lucide-react";
import { playSoundEffect } from "@/lib/audio";

interface LetterCircleProps {
  letters: string[];
  onWordFormed: (word: string) => void;
  onShuffle: () => void;
  onUseHint: () => void;
  onToggleMultiplayer: () => void;
}

interface LetterPosition {
  letter: string;
  element: HTMLDivElement | null;
  selected: boolean;
}

export function LetterCircle({
  letters,
  onWordFormed,
  onShuffle,
  onUseHint,
  onToggleMultiplayer
}: LetterCircleProps) {
  const [positions, setPositions] = useState<LetterPosition[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [shuffledLetters, setShuffledLetters] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create a shuffled copy of the letters
    setShuffledLetters([...letters].sort(() => Math.random() - 0.5));
  }, [letters]);

  useEffect(() => {
    // Initialize letter positions
    const newPositions: LetterPosition[] = shuffledLetters.map(letter => ({
      letter,
      element: null,
      selected: false
    }));
    
    setPositions(newPositions);
  }, [shuffledLetters]);

  const handleLetterRef = (index: number, element: HTMLDivElement | null) => {
    if (element && positions[index] && positions[index].element !== element) {
      setPositions(prevPositions => {
        const newPositions = [...prevPositions];
        if (newPositions[index]) {
          newPositions[index] = {
            ...newPositions[index],
            element
          };
        }
        return newPositions;
      });
    }
  };

  const handleLetterDown = (index: number) => {
    playSoundEffect("select");
    
    // Reset current state
    setPositions(prevPositions => 
      prevPositions.map(pos => ({ ...pos, selected: false }))
    );
    
    // Select the current letter
    setPositions(prevPositions => {
      const newPositions = [...prevPositions];
      newPositions[index] = {
        ...newPositions[index],
        selected: true
      };
      return newPositions;
    });
    
    setCurrentWord(positions[index].letter);
    setIsDragging(true);
    
    // Clear previous path
    if (pathRef.current) {
      pathRef.current.setAttribute("d", "");
    }
    
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging || !containerRef.current || !svgRef.current) return;
    
    // Get pointer position relative to container
    const containerRect = containerRef.current.getBoundingClientRect();
    const svgRect = svgRef.current.getBoundingClientRect();
    
    // Find if pointer is over any letter
    const elementUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
    const letterElement = elementUnderPointer?.closest("[data-letter-index]") as HTMLElement;
    
    if (letterElement) {
      const letterIndex = parseInt(letterElement.dataset.letterIndex || "-1");
      
      if (letterIndex >= 0 && !positions[letterIndex].selected) {
        playSoundEffect("select");
        
        // Select this letter
        setPositions(prevPositions => {
          const newPositions = [...prevPositions];
          newPositions[letterIndex] = {
            ...newPositions[letterIndex],
            selected: true
          };
          return newPositions;
        });
        
        // Add to current word
        setCurrentWord(prev => prev + positions[letterIndex].letter);
      }
    }
    
    // Update the SVG path
    updateWordPath();
  };

  const handlePointerUp = () => {
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    
    setIsDragging(false);
    
    // Check if word is valid (minimum 3 letters)
    if (currentWord.length >= 3) {
      onWordFormed(currentWord);
    }
    
    // Reset after a small delay
    setTimeout(() => {
      setPositions(prevPositions => 
        prevPositions.map(pos => ({ ...pos, selected: false }))
      );
      setCurrentWord("");
      
      // Clear path
      if (pathRef.current) {
        pathRef.current.setAttribute("d", "");
      }
    }, 300);
  };

  const updateWordPath = () => {
    if (!svgRef.current || !pathRef.current || !containerRef.current) return;
    
    const selectedPositions = positions
      .filter(pos => pos.selected && pos.element)
      .map(pos => pos.element!);
    
    if (selectedPositions.length <= 0) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    let pathData = "";
    
    selectedPositions.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - svgRect.left;
      const y = rect.top + rect.height / 2 - svgRect.top;
      
      if (index === 0) {
        pathData = `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });
    
    pathRef.current.setAttribute("d", pathData);
  };

  const handleShuffle = () => {
    setShuffledLetters([...shuffledLetters].sort(() => Math.random() - 0.5));
    onShuffle();
  };

  // Calculate positions in a circle
  const getLetterPosition = (index: number, total: number) => {
    const radius = 110; // Adjust radius as needed
    const angle = (index / total) * 2 * Math.PI;
    
    // Calculate position on the circle
    const x = 50 + 50 * Math.sin(angle);
    const y = 50 - 50 * Math.cos(angle);
    
    return { x, y };
  };

  return (
    <div className="relative mb-6" ref={containerRef}>
      {/* Circle Background */}
      <div className="letter-circle w-64 h-64 rounded-full flex items-center justify-center glow-effect relative">
        <div className="absolute inset-2 rounded-full bg-background/80 flex items-center justify-center">
          {/* Current Word Display */}
          <div className="absolute text-center w-full">
            <p className="text-2xl font-bold text-accent transition-all">
              {currentWord}
            </p>
          </div>
        </div>
        
        {/* Letter Tiles */}
        <div className="absolute inset-0">
          {shuffledLetters.map((letter, index) => {
            const { x, y } = getLetterPosition(index, shuffledLetters.length);
            return (
              <div
                key={index}
                ref={(el) => handleLetterRef(index, el)}
                data-letter-index={index}
                className={`letter-tile absolute transform transition-all cursor-pointer ${
                  positions[index]?.selected ? "bg-accent text-accent-foreground" : ""
                }`}
                style={{
                  top: `${y}%`,
                  left: `${x}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onPointerDown={() => handleLetterDown(index)}
              >
                <span className="text-2xl font-bold">{letter}</span>
              </div>
            );
          })}
        </div>
        
        {/* Line Drawing SVG for word paths */}
        <svg 
          ref={svgRef}
          className="absolute inset-0 z-10 pointer-events-none" 
          width="100%" 
          height="100%"
        >
          <path 
            ref={pathRef}
            className="word-path" 
            stroke="#4cc9f0" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round" 
          />
        </svg>
      </div>
      
      {/* Game Action Buttons */}
      <div className="flex justify-center mt-6 gap-5">
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full bg-card hover:bg-primary transition-all glow-effect magic-btn"
          onClick={handleShuffle}
        >
          <RefreshCw className="h-6 w-6" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full bg-card hover:bg-primary transition-all glow-effect magic-btn"
          onClick={onUseHint}
        >
          <Lightbulb className="h-6 w-6" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full bg-card hover:bg-primary transition-all glow-effect magic-btn"
          onClick={onToggleMultiplayer}
        >
          <Users className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
