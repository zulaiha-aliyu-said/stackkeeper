import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Analytics from "./pages/Analytics";
import Insights from "./pages/Insights";
import Network from "./pages/Network";
import Extension from "./pages/Extension";
import Battles from "./pages/Battles";
import Profile from "./pages/Profile";
import BattleChallenge from "./pages/BattleChallenge";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(222 47% 9%)',
            border: '1px solid hsl(217 33% 20%)',
            color: 'hsl(210 40% 98%)',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/network" element={<Network />} />
          <Route path="/extension" element={<Extension />} />
          <Route path="/battles" element={<Battles />} />
          <Route path="/battle" element={<BattleChallenge />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
