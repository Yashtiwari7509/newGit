import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import HealthTracker from "./pages/HealthTracker";
import Appointments from "./pages/Appointments";
import PreventiveHealth from "./pages/PreventiveHealth";
import Insurance from "./pages/Insurance";
import Symptoms from "./pages/Symptoms";
import BMI from "./pages/BMI";
import Medicine from "./pages/Medicine";
import NotFound from "./pages/NotFound";
import Login from "./auth/Login";
import Register from "./auth/Register";
import { ThemeProvider } from "./utils/theme.provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Profile from "./pages/Profile";
// import ChatPage from "./components/Chat";
import { AuthProvider } from "./auth/AuthProvider";
import { SocketProvider } from "./utils/SocketProvider";
import ChatCall from "./pages/chat/VideoChat";
import DocRegister from "./auth/DocRegister";
import AiDoctor from "./pages/AiDoctor";
import Ayushman from "./pages/Ayushman";

const queryClient = new QueryClient();

// Wrapper component for authenticated routes with socket connection
const AuthenticatedRoute = ({ children }) => (
  <AuthProvider>
    <SocketProvider>{children}</SocketProvider>
  </AuthProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
      onScriptLoadError={() => console.error("Google Script failed to load")}
    >
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <AuthenticatedRoute>
                    <Index />
                  </AuthenticatedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/doc-register" element={<DocRegister />} />
              <Route
                path="/profile"
                element={
                  <AuthenticatedRoute>
                    <Profile />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/health-tracker"
                element={
                  <AuthenticatedRoute>
                    <HealthTracker />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <AuthenticatedRoute>
                    <Appointments />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/preventive-health"
                element={
                  <AuthenticatedRoute>
                    <PreventiveHealth />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/insurance"
                element={
                  <AuthenticatedRoute>
                    <Insurance />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/symptoms"
                element={
                  <AuthenticatedRoute>
                    <Symptoms />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/bmi"
                element={
                  <AuthenticatedRoute>
                    <BMI />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/medicine"
                element={
                  <AuthenticatedRoute>
                    <Medicine />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <AuthenticatedRoute>
                    <ChatCall />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/ai-doctor"
                element={
                  <AuthenticatedRoute>
                    <AiDoctor />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/ayushman"
                element={
                  <AuthenticatedRoute>
                    <Ayushman />
                  </AuthenticatedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);

export default App;
