import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Multiplayer from "@/pages/multiplayer";
import { useEffect, useState } from "react";
import { TermsModal } from "./components/modals/terms-modal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/multiplayer" component={Multiplayer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    return localStorage.getItem("hasAcceptedTerms") === "true";
  });

  const [showTerms, setShowTerms] = useState(!hasAcceptedTerms);

  const handleAcceptTerms = () => {
    localStorage.setItem("hasAcceptedTerms", "true");
    setHasAcceptedTerms(true);
    setShowTerms(false);
  };

  useEffect(() => {
    if (!hasAcceptedTerms) {
      setShowTerms(true);
    }
  }, [hasAcceptedTerms]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-b from-[#051937] to-[#2b4b8f]">
          <Toaster />
          {showTerms && (
            <TermsModal
              open={showTerms}
              onAccept={handleAcceptTerms}
              onDecline={() => setShowTerms(false)}
            />
          )}
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
