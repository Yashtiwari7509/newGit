import { useEffect } from "react";
import { useSocket } from "@/utils/SocketProvider";
import { useAuth } from "@/auth/AuthProvider";
import api from "@/utils/api";

/**
 * Hook to automatically update user's online status based on browser visibility and activity
 * @param options Configuration options
 * @returns void
 */
export const useOnlineStatus = (
  options = { updateInterval: 5 * 60 * 1000 }
) => {
  const { socket } = useSocket();
  const { currentUser, currentDoctor, userType } = useAuth();

  const currentId = userType === "user" ? currentUser?._id : currentDoctor?._id;

  // Update online status via API for persistence
  const updateStatusViaApi = async (isOnline: boolean) => {
    if (!currentId) return;

    try {
      const endpoint =
        userType === "user" ? "/users/status" : "/doctors/status";
      await api.put(endpoint, {
        isOnline,
        lastActive: new Date(),
      });
    } catch (error) {
      console.error("Error updating online status via API:", error);
    }
  };

  // Handle visibility change
  useEffect(() => {
    if (!socket || !currentId) return;

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";

      if (isVisible) {
        // User is back on the page, update status to online
        socket.emit("user-connect", {
          userId: currentId,
          userType,
        });
        updateStatusViaApi(true);
      } else {
        // User left the page, update lastActive but keep online
        updateStatusViaApi(true);
      }
    };

    // Set up periodic updates while the user is active
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        updateStatusViaApi(true);
      }
    }, options.updateInterval);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [socket, currentId, userType]);

  // Handle page unload
  useEffect(() => {
    if (!currentId) return;

    const handleBeforeUnload = () => {
      // This is a best-effort attempt as browsers may not wait for this to complete
      navigator.sendBeacon(
        `${import.meta.env.VITE_BASE_URL}/api/${
          userType === "user" ? "users" : "doctors"
        }/status/beacon`,
        JSON.stringify({ isOnline: false, lastActive: new Date() })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentId, userType]);
};
