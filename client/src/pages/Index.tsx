import { HealthMetricCard } from "@/components/HealthMetricCard";
import { AppointmentList } from "@/components/AppointmentList";
import { QuickActions } from "@/components/QuickActions";
import { Activity, Heart, Weight, Thermometer } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import MainLayout from "@/components/layout/MainLayout";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import "../index.css";
import ThreeScene from "@/components/GodRays";
import { cardsProps, profileProps, UserProps } from "@/lib/user.type";
import { useAuth } from "@/auth/AuthProvider";

const healthCard = [
  {
    title: "Heart Rate",
    value: "72 bpm",
    trend: "5% lower than last week",
    icon: Heart,
    trendDirection: "down",
  },
  {
    title: "Blood Pressure",
    value: "120/80",
    trend: "Normal range",
    icon: Activity,
    trendDirection: "neutral",
  },
  {
    title: "Weight",
    value: "75 kg",
    trend: "2% up this month",
    icon: Weight,
    trendDirection: "up",
  },
  {
    title: "Temperature",
    value: "36.6°C",
    trend: "Normal",
    icon: Thermometer,
    trendDirection: "neutral",
  },
];
const Index = () => {
  const { currentDoctor, currentUser, userType, isLoading } = useAuth();

  return (
    <MainLayout>
      <div className="min-h-screen flex w-full dark:bg-black">
        <main className="flex-1">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold primary-grad">
                  Welcome back,{" "}
                  {userType === "user"
                    ? currentUser?.firstName
                    : currentDoctor?.firstName}
                </h1>
                <p className="text-gray-500 mt-1">
                  Here's your health overview
                </p>
              </div>
              {/* <div className="w-12 h-12 rounded-full">{user?.firstName}</div> */}
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* Health Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {healthCard.map((card: cardsProps, i) => (
                <HealthMetricCard
                  title={card.title}
                  value={card.value}
                  trend={card.trend}
                  icon={card.icon}
                  trendDirection={card.trendDirection}
                  key={i}
                />
              ))}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppointmentList />
              {/* Add more sections here in future iterations */}
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default Index;
