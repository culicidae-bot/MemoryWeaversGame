import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function TermsModal({ open, onAccept, onDecline }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onDecline()}>
      <DialogContent className="bg-card/90 border-accent/30 p-6 m-4 max-w-lg w-full">
        <h2 className="font-cinzel text-2xl mb-4 text-center text-white">Terms & Conditions</h2>
        
        <ScrollArea className="max-h-80 overflow-y-auto mb-4 text-sm pr-4">
          <div className="space-y-4">
            <p>Welcome to Mystic Word Realms! Before you begin your magical journey, please read and accept the following terms:</p>
            
            <ul className="list-disc pl-5 space-y-2">
              <li>Player progress and scores are stored online.</li>
              <li>The game is free and does not collect personal data.</li>
              <li>Any form of cheating, automation, or exploit will result in a ban.</li>
              <li>Players must be 13+ years old to use multiplayer.</li>
              <li>All user data is subject to deletion or reset during beta testing.</li>
            </ul>
            
            <p>By clicking "Accept", you confirm that you have read, understood, and agree to these terms.</p>
          </div>
        </ScrollArea>
        
        <div className="flex justify-center gap-4">
          <Button
            className="bg-primary hover:bg-primary/80 text-white font-medium py-2 px-6 rounded-full transition-all magic-btn"
            onClick={onAccept}
          >
            Accept
          </Button>
          
          <Button
            variant="outline"
            className="bg-card hover:bg-background/80 text-white font-medium py-2 px-6 rounded-full transition-all magic-btn"
            onClick={onDecline}
          >
            Decline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
