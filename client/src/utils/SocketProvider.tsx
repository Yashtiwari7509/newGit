import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const SocketProvider = ({ children }) => {
  const { currentUser, currentDoctor, userType } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current user ID
  const currentId = userType === "user" ? currentUser?._id : currentDoctor?._id;

  useEffect(() => {
    if (!currentId || !userType) return;

    // Connect to socket server
    socketRef.current = io(import.meta.env.VITE_BASE_URL, {
      query: {
        userId: currentId,
        userType,
      },
    });

    // Handle connection events
    socketRef.current.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);

      // Send user connect event
      socketRef.current.emit("user-connect", {
        userId: currentId,
        userType,
      });
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    // Listen for user status changes
    socketRef.current.on("user-status-change", (data) => {
      console.log("User status change:", data);
      // Invalidate queries to refresh user lists
      queryClient.invalidateQueries({ queryKey: ["available-users"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // If this is the current user's doctor or a doctor the user is chatting with
      if (
        userType === "user" &&
        currentUser?.appointments?.some((appt) => appt.doctorId === data.userId)
      ) {
        toast({
          title: `Doctor is now ${data.isOnline ? "online" : "offline"}`,
          description: `A doctor you're connected with is now ${
            data.isOnline ? "available" : "unavailable"
          }`,
          duration: 3000,
        });
      }
    });

    // Set up page visibility change to update status
    const handleVisibilityChange = () => {
      if (socketRef.current && document.visibilityState === "visible") {
        // User is back on the page, update status to online
        socketRef.current.emit("user-connect", {
          userId: currentId,
          userType,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentId, userType]);

  // Update online status when window is closing
  useEffect(() => {
    const handleBeforeUnload = () => {
      // This won't actually work in most cases due to how browsers handle beforeunload
      // But we'll include it as a best effort
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook to access socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
