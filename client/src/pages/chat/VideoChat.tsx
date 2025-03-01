import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Video,
  Send,
  UserCheck,
  User2,
  Loader2,
  PhoneOff,
  Star,
  StarHalf,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  GraduationCap,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/AuthProvider";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import io from "socket.io-client";
import api from "@/utils/api";
import {
  doctor_UserProps,
  doctorProfileProps,
  UserProps,
  Review,
} from "@/lib/user.type";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { ZIM } from "zego-zim-web";
import { randomID } from "@/lib/utils";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Label } from "@/components/ui/label";

// Define types
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isOnline: boolean;
  phoneNumber: string;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  isOnline: boolean;
  phoneNumber: string;
  experience?: number;
  qualifications?: string[];
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
  availability?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}

interface Message {
  _id: string;
  text: string;
  sender: {
    id: string;
    type: "user" | "doctor";
  };
  receiver: {
    id: string;
    type: "user" | "doctor";
  };
  read: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: {
    id: string;
    model: string;
    unreadCount: number;
  }[];
  lastMessage: {
    text: string;
    sender: string;
    timestamp: string;
  };
  messages: Message[];
}

interface ReviewFormData {
  rating: number;
  comment: string;
  doctorId: string;
}

const Chat = () => {
  const queryClient = useQueryClient();
  const { currentUser, currentDoctor, userType } = useAuth();
  const [selectedRecipient, setSelectedRecipient] = useState<
    User | Doctor | null
  >(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isVideoCall, setIsVideoCall] = useState(false);
  const { toast } = useToast();
  const socketRef = useRef<any>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [zegoCloud, setZegoCloud] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // Add this function with the other handler functions in your component
  const handlePhoneClick = () => {
    setShowDialog(true);
  };

  // Get current user ID and type
  const currentId = userType === "user" ? currentUser?._id : currentDoctor?._id;

  // Fetch available doctors/users depending on user type
  const { data: availableUsers } = useQuery({
    queryKey: ["available-users"],
    queryFn: async () => {
      const { data } = await api.get(
        userType === "user" ? "/doctors/available" : "/users/available"
      );
      console.log(data);

      return data;
    },
    enabled: !!currentId,
  });

  // Initialize ZegoCloud
  useEffect(() => {
    console.log(selectedRecipient, "selected part");

    const initZegoCloud = async () => {
      const appID = 263201994; // Replace with your ZegoCloud App ID
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_URL; // Replace with your Server Secret

      const userID = currentId || randomID(5);
      const userName = currentDoctor
        ? `${currentDoctor.firstName} ${currentDoctor.lastName}`
        : currentUser
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : `User_${randomID(5)}`;

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        null,
        userID,
        userName
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.addPlugins({ ZIM });

      // Set up call invitation handlers
      zp.setCallInvitationConfig({
        onIncomingCallReceived: (callID, caller) => {
          toast({
            title: "Incoming Call",
            description: `${caller.userName} is calling...`,
            duration: 3000,
          });
        },
        onIncomingCallCanceled: (callID, caller) => {
          toast({
            title: "Call Canceled",
            description: `${caller.userName} canceled the call`,
            duration: 3000,
          });
        },
        onOutgoingCallAccepted: (callID, callee) => {
          toast({
            title: "Call Accepted",
            description: `${callee.userName} accepted the call`,
            duration: 3000,
          });
        },
        onOutgoingCallRejected: (callID, callee) => {
          toast({
            title: "Call Rejected",
            description: `${callee.userName} rejected the call`,
            duration: 3000,
          });
        },
        onCallInvitationEnded: (reason, data) => {
          setIsVideoCall(false);
          toast({
            title: "Call Ended",
            description: `The call has ended`,
            duration: 3000,
          });
        },
      });

      setZegoCloud(zp);
    };

    if (currentId) {
      initZegoCloud();
    }

    return () => {
      if (zegoCloud) {
        zegoCloud.destroy();
      }
    };
  }, [currentId, currentUser, currentDoctor]);

  // Initialize socket connection
  useEffect(() => {
    if (!currentId) return;

    // Connect to socket server
    socketRef.current = io(import.meta.env.VITE_BASE_URL, {
      query: {
        userId: currentId,
        userType,
      },
    });

    // Send user connect event
    socketRef.current.emit("user-connect", {
      userId: currentId,
      userType,
    });

    // Listen for new messages
    socketRef.current.on("new-message", (data) => {
      // If the message is for the current conversation, add it to messages
      if (
        currentConversation &&
        data.conversationId === currentConversation._id
      ) {
        setMessages((prev) => [...prev, data.message]);
      }

      // Update conversations list
      fetchConversations();
    });

    // Listen for message notifications
    socketRef.current.on("message-notification", (data) => {
      toast({
        title: "New Message",
        description: `You have a new message in conversation ${
          userType === "user" ? "with Doctor" : "from User"
        }`,
      });
    });

    // Listen for user status changes
    socketRef.current.on("user-status-change", (data) => {
      // Update user status in the list
      queryClient.invalidateQueries({ queryKey: ["available-users"] });
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentId, userType]);

  // Fetch user conversations
  const fetchConversations = () => {
    if (!currentId) return;

    socketRef.current.emit("get-conversations", { userId: currentId });
    socketRef.current.on("user-conversations", (data) => {
      setConversations(data.conversations);
    });
  };

  // Fetch conversations on component mount
  useEffect(() => {
    if (socketRef.current) {
      fetchConversations();
    }
  }, [socketRef.current]);

  // Fetch chat history when a recipient is selected
  useEffect(() => {
    if (!selectedRecipient || !currentId) return;

    // Find existing conversation or create new one
    const recipientId = selectedRecipient._id;
    const existingConversation = conversations.find((conv) =>
      conv.participants.some((p) => p.id === recipientId)
    );

    if (existingConversation) {
      setCurrentConversation(existingConversation);

      // Fetch messages for this conversation
      socketRef.current.emit("get-chat-history", {
        conversationId: existingConversation._id,
      });

      socketRef.current.on("chat-history", (data) => {
        if (data.conversationId === existingConversation._id) {
          setMessages(data.messages);

          // Mark messages as read
          socketRef.current.emit("mark-messages-read", {
            conversationId: existingConversation._id,
            userId: currentId,
          });
        }
      });
    } else {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [selectedRecipient, currentId, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRecipient || !currentId) return;

    const recipientId = selectedRecipient._id;
    const recipientType = userType === "user" ? "doctor" : "user";

    // Prepare message data
    const messageData = {
      senderId: currentId,
      receiverId: recipientId,
      text: newMessage,
      senderType: userType,
      receiverType: recipientType,
    };

    // Send message via socket
    socketRef.current.emit("send-message", messageData);

    // Clear input
    setNewMessage("");
  };

  // Start video call
  const startVideoCall = async () => {
    if (!selectedRecipient || !zegoCloud) return;

    const roomID = `room_${randomID(5)}`;

    try {
      await zegoCloud.sendCallInvitation({
        callees: [
          {
            userID: selectedRecipient._id,
            userName: getRecipientName(selectedRecipient),
          },
        ],
        callType: ZegoUIKitPrebuilt.InvitationTypeVideoCall,
        timeout: 60,
      });

      if (videoContainerRef.current) {
        zegoCloud.joinRoom({
          container: videoContainerRef.current,
          sharedLinks: [
            {
              name: "Copy Link",
              url: `${window.location.origin}/room?roomID=${roomID}`,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showPreJoinView: false,
        });
      }

      setIsVideoCall(true);

      toast({
        title: "Starting video call",
        description: `Connecting to ${getRecipientName(selectedRecipient)}...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start video call",
        variant: "destructive",
      });
    }
  };

  // End video call
  const endVideoCall = () => {
    setIsVideoCall(false);
    toast({
      title: "Call ended",
      description: "The call has ended",
    });
  };

  // Helper function to get recipient name
  const getRecipientName = (recipient: User | Doctor) => {
    return `${recipient.firstName} ${recipient.lastName}`;
  };

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await api.post(`/doctors/reviews`, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Review Added",
        description: "Your review has been added successfully",
      });
      setShowReviewDialog(false);
      setRating(0);
      setComment("");
      // Refetch doctor data to update reviews
      queryClient.invalidateQueries({ queryKey: ["available-users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add review. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to calculate average rating
  const calculateAverageRating = (reviews: Review[] | undefined): number => {
    if (!reviews || reviews.length === 0) return 0;

    const validReviews = reviews.filter(
      (review) => typeof review.rating === "number" && !isNaN(review.rating)
    );

    if (validReviews.length === 0) return 0;

    const totalRating = validReviews.reduce(
      (sum, review) =>
        sum + (typeof review.rating === "number" ? review.rating : 0),
      0
    );

    const average = totalRating / validReviews.length;
    return Number(average.toFixed(1)) || 0;
  };

  // Function to get total reviews count
  const getTotalReviews = (reviews: Review[] | undefined): number => {
    if (!reviews) return 0;
    return reviews.filter(
      (review) => typeof review.rating === "number" && !isNaN(review.rating)
    ).length;
  };

  // Function to render stars for rating
  const renderStars = (rating: number) => {
    const stars = [];
    const safeRating = Number(rating) || 0;
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <StarHalf
            key={i}
            className="h-4 w-4 fill-yellow-400 text-yellow-400"
          />
        );
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }

    return stars;
  };

  return (
    <MainLayout>
      <div className="container mx-auto animate-in">
        <h1 className="mb-6 text-2xl font-bold">
          Chat with {userType === "user" ? "Doctors" : "Patients"}
        </h1>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Available Users/Doctors List */}
          <Card className="h-[calc(100vh-200px)]">
            <CardHeader>
              <CardTitle>
                Available {userType === "user" ? "Doctors" : "Users"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                {/* Show available conversations */}
                {conversations.length > 0 && (
                  <div className="mb-4">
                    <h3 className="p-2 text-sm font-medium text-muted-foreground">
                      Recent Conversations
                    </h3>
                    {conversations.map((conversation) => {
                      // Find the other participant
                      const otherParticipant = conversation.participants.find(
                        (p) => p.id !== currentId
                      );

                      // Find full user/doctor data from available users
                      const recipientData = availableUsers?.data?.find(
                        (u: UserProps | doctorProfileProps) =>
                          u._id === otherParticipant?.id
                      );

                      if (!recipientData) return null;

                      return (
                        <div
                          key={conversation._id}
                          className={`flex cursor-pointer items-center gap-3 border-b p-4 transition-colors hover:bg-accent ${
                            selectedRecipient?._id === recipientData._id
                              ? "bg-accent"
                              : ""
                          }`}
                          onClick={() => setSelectedRecipient(recipientData)}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={`https://i.pravatar.cc/150?img=${recipientData._id}`}
                              />
                              <AvatarFallback>
                                {recipientData.firstName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                                recipientData.isOnline
                                  ? "bg-green-500"
                                  : "bg-zinc-500"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {recipientData.firstName +
                                " " +
                                recipientData.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage?.text ||
                                "No messages yet"}
                            </p>
                          </div>
                          {/* {otherParticipant?.unreadCount > 0 && (
                            <Badge variant="destructive">
                              {otherParticipant.unreadCount}
                            </Badge>
                          )} */}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Show available users/doctors */}
                <h3 className="p-2 text-sm font-medium text-muted-foreground">
                  All {userType === "user" ? "Doctors" : "Users"}
                </h3>
                {availableUsers?.data?.map((recipient: doctor_UserProps) => (
                  <div
                    key={recipient._id}
                    className={`flex cursor-pointer items-center gap-3 border-b p-4 transition-colors hover:bg-accent ${
                      selectedRecipient?._id === recipient._id
                        ? "bg-accent"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedRecipient({
                        ...recipient,
                        _id: recipient._id,
                        isOnline: true,
                      })
                    }
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={`https://i.pravatar.cc/150?img=${recipient._id}`}
                        />
                        <AvatarFallback>
                          {recipient.firstName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                          recipient.isOnline ? "bg-green-500" : "bg-zinc-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {recipient.firstName + " " + recipient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userType === "user" && "specialization" in recipient
                          ? recipient.specialization
                          : ""}
                      </p>
                    </div>
                    <Badge
                      variant={recipient.isOnline ? "default" : "secondary"}
                    >
                      {recipient.isOnline ? "active" : "offline"}
                    </Badge>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="h-[calc(100vh-200px)]">
            {selectedRecipient ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={`https://i.pravatar.cc/150?img=${selectedRecipient._id}`}
                        />
                        <AvatarFallback>
                          {selectedRecipient.firstName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>
                          {getRecipientName(selectedRecipient)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {userType === "user" &&
                          "specialization" in selectedRecipient
                            ? selectedRecipient.specialization
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePhoneClick}
                      >
                        <Info className="h-4 w-4" />
                      </Button>

                      {/* Phone Call Dialog */}
                      <Dialog open={showDialog} onOpenChange={setShowDialog}>
                        {selectedRecipient && (
                          <>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>
                                  {userType === "user"
                                    ? "Doctor Profile"
                                    : "User Profile"}
                                </DialogTitle>
                              </DialogHeader>

                              <div className="flex flex-col gap-4 py-4">
                                {/* Basic Info */}
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage
                                      src={`https://i.pravatar.cc/150?img=${selectedRecipient._id}`}
                                    />
                                    <AvatarFallback>
                                      {selectedRecipient.firstName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold">
                                      {getRecipientName(selectedRecipient)}
                                    </h3>
                                    {"specialization" in selectedRecipient && (
                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Stethoscope className="h-4 w-4" />
                                        {selectedRecipient.specialization}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                      <Phone className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        {selectedRecipient.phoneNumber}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Primary Phone
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Doctor Specific Info */}
                                {"specialization" in selectedRecipient && (
                                  <>
                                    {/* Experience & Qualifications */}
                                    <div className="space-y-3">
                                      {selectedRecipient.experience && (
                                        <div className="flex items-center gap-2">
                                          <GraduationCap className="h-4 w-4 text-primary" />
                                          <span>
                                            {selectedRecipient.experience} years
                                            of experience
                                          </span>
                                        </div>
                                      )}
                                      {selectedRecipient.qualifications && (
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium">
                                            Qualifications
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {selectedRecipient.qualifications.map(
                                              (qual, index) => (
                                                <Badge
                                                  key={index}
                                                  variant="secondary"
                                                >
                                                  {qual}
                                                </Badge>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Availability */}
                                    {selectedRecipient.availability && (
                                      <div className="space-y-2">
                                        <p className="text-sm font-medium">
                                          Availability
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                          {selectedRecipient.availability.map(
                                            (slot, index) => (
                                              <div
                                                key={index}
                                                className="flex items-center gap-2 text-sm"
                                              >
                                                <Calendar className="h-4 w-4" />
                                                <span>{slot.day}:</span>
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                  {slot.startTime} -{" "}
                                                  {slot.endTime}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Reviews Section */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-medium">
                                            Reviews
                                          </h4>
                                          {"reviews" in selectedRecipient &&
                                            selectedRecipient.reviews && (
                                              <div className="flex items-center">
                                                <div className="flex">
                                                  {renderStars(
                                                    calculateAverageRating(
                                                      selectedRecipient.reviews
                                                    )
                                                  )}
                                                </div>
                                                <span className="ml-1 text-sm">
                                                  {calculateAverageRating(
                                                    selectedRecipient.reviews
                                                  ) > 0 ? (
                                                    <>
                                                      (
                                                      {calculateAverageRating(
                                                        selectedRecipient.reviews
                                                      )}
                                                      ) ·{" "}
                                                      {getTotalReviews(
                                                        selectedRecipient.reviews
                                                      )}{" "}
                                                      reviews
                                                    </>
                                                  ) : (
                                                    "No ratings yet"
                                                  )}
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                        {userType === "user" && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setShowReviewDialog(true)
                                            }
                                          >
                                            Add Review
                                          </Button>
                                        )}
                                      </div>

                                      {"reviews" in selectedRecipient &&
                                      selectedRecipient.reviews &&
                                      selectedRecipient.reviews.length > 0 ? (
                                        <ScrollArea className="h-40">
                                          <div className="space-y-3">
                                            {selectedRecipient.reviews.map(
                                              (review) => (
                                                <div
                                                  key={review._id}
                                                  className="space-y-1"
                                                >
                                                  <div className="flex items-center justify-between">
                                                    <p className="font-medium">
                                                      {review.userFirstName}{" "}
                                                      {review.userLastName}
                                                    </p>
                                                    <div className="flex">
                                                      {renderStars(
                                                        review.rating
                                                      )}
                                                    </div>
                                                  </div>
                                                  <p className="text-sm text-muted-foreground">
                                                    {review.comment}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">
                                                    {new Date(
                                                      review.createdAt
                                                    ).toLocaleDateString()}
                                                  </p>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </ScrollArea>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          No reviews yet
                                        </p>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>

                              <DialogFooter className="flex flex-row gap-2 sm:justify-center">
                                {selectedRecipient.phoneNumber && (
                                  <Button
                                    className="flex items-center gap-2"
                                    onClick={() =>
                                      window.open(
                                        `tel:${selectedRecipient.phoneNumber}`
                                      )
                                    }
                                  >
                                    <Phone className="h-4 w-4" />
                                    Call Now
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  onClick={() => setShowDialog(false)}
                                >
                                  <PhoneOff className="h-4 w-4 mr-2" />
                                  Close
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </>
                        )}
                      </Dialog>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={startVideoCall}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex h-[calc(100%-160px)] flex-col justify-between p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${
                            message.sender.id === currentId
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`rounded-lg px-4 py-2 max-w-[80%] ${
                              message.sender.id === currentId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <div
                              className={`flex gap-2 items-center ${
                                message.sender.id === currentId
                                  ? "flex-row-reverse"
                                  : ""
                              }`}
                            >
                              {message.sender.id === currentId ? (
                                <UserCheck size={15} />
                              ) : (
                                <User2 size={15} />
                              )}

                              <p className="break-words">{message.text}</p>
                            </div>
                            <p className="mt-1 text-xs opacity-70">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messageEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="border-t p-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" className="flex-shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <User2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>
                    Select a {userType === "user" ? "doctor" : "user"} to start
                    chatting
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Video Call Dialog */}
        <Dialog
          open={isVideoCall}
          onOpenChange={(open) => !open && endVideoCall()}
        >
          <DialogContent className="h-[80vh] max-w-4xl p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center justify-between">
                <span>
                  Video Call with{" "}
                  {selectedRecipient ? getRecipientName(selectedRecipient) : ""}
                </span>
                <Button variant="destructive" size="sm" onClick={endVideoCall}>
                  End Call
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div
              ref={videoContainerRef}
              className="h-full w-full bg-black relative"
            >
              {/* ZegoCloud will render the video UI here */}
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>
                    Connecting to{" "}
                    {selectedRecipient
                      ? getRecipientName(selectedRecipient)
                      : ""}
                    ...
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Review</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Comment</Label>
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your review..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (rating === 0) {
                    toast({
                      title: "Error",
                      description: "Please select a rating",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (!selectedRecipient?._id) {
                    toast({
                      title: "Error",
                      description: "No doctor selected",
                      variant: "destructive",
                    });
                    return;
                  }
                  addReviewMutation.mutate({
                    rating,
                    comment,
                    doctorId: selectedRecipient._id,
                  });
                }}
                disabled={addReviewMutation.isPending}
              >
                {addReviewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Chat;
