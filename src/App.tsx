import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Library from "./pages/Library";
import Analytics from "./pages/Analytics";
import Extension from "./pages/Extension";
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
          <Route path="/" element={<Index />} />
          <Route path="/library" element={<Library />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/extension" element={<Extension />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
