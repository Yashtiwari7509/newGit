import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Hospital, 
  Users, 
  Search, 
  MapPin, 
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wallet,
  Download,
  Loader2,
  Star,
  Calendar,
  BadgeIndianRupee,
  Building2,
  Stethoscope
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/utils/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AyushmanDetails {
  cardNumber: string;
  beneficiaryName: string;
  familyMembers: number;
  validUntil: string;
  status: string;
  availableBalance: string;
  usedAmount: string;
}

interface Hospital {
  id: number;
  name: string;
  distance: string;
  address: string;
  phone: string;
  specialties: string[];
  rating: number;
  waitTime: string;
}

interface Claim {
  id: string;
  date: string;
  hospital: string;
  treatment: string;
  amount: number;
  status: string;
}

const LoadingCard = () => (
  <Card>
    <CardHeader className="space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-20 w-full" />
    </CardContent>
  </Card>
);

const LoadingHospital = () => (
  <div className="p-4 border rounded-lg space-y-3">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-20" />
    </div>
  </div>
);

const LoadingClaim = () => (
  <div className="flex items-center justify-between border-b pb-4">
    <div className="space-y-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="h-8 w-24" />
  </div>
);

const Ayushman = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  
  const [ayushmanDetails, setAyushmanDetails] = useState<AyushmanDetails | null>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState({
    details: true,
    hospitals: true,
    claims: true
  });

  useEffect(() => {
    // Simulate real API calls with delayed responses
    const fetchData = async () => {
      try {
        // Fetch card details
        setTimeout(async () => {
          const detailsResponse = await api.get('/ayushman/details');
          setAyushmanDetails(detailsResponse.data.data);
          setLoading(prev => ({ ...prev, details: false }));
        }, 1500);

        // Fetch hospitals with longer delay
        setTimeout(async () => {
          const hospitalsResponse = await api.get('/ayushman/hospitals');
          setNearbyHospitals(hospitalsResponse.data.data);
          setLoading(prev => ({ ...prev, hospitals: false }));
        }, 2000);

        // Fetch claims with medium delay
        setTimeout(async () => {
          const claimsResponse = await api.get('/ayushman/claims');
          setRecentClaims(claimsResponse.data.data);
          setLoading(prev => ({ ...prev, claims: false }));
        }, 1800);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch some data. Please try again later.');
      }
    };

    fetchData();
  }, []);

  const filteredHospitals = nearbyHospitals.filter((hospital) =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleDownloadCard = async () => {
    try {
      setIsDownloading(true);

      if (!aadhaarNumber || !mobileNumber) {
        toast.error("Please enter both Aadhaar number and mobile number");
        return;
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await api.post("/api/ayushman/download", {
        aadhaarNumber,
        mobileNumber
      });

      if (response.data.success) {
        toast.success("Card details fetched successfully!");
        window.open(response.data.data.downloadLink, "_blank");
        setShowDownloadDialog(false);
      } else {
        toast.error(response.data.message || "Failed to fetch card details");
      }
    } catch (error) {
      console.error("Error downloading card:", error);
      toast.error(error.response?.data?.message || "Failed to download card");
    } finally {
      setIsDownloading(false);
    }
  };

  const calculateUsagePercentage = () => {
    if (!ayushmanDetails) return 0;
    const used = parseInt(ayushmanDetails.usedAmount.replace(/[^0-9]/g, ''));
    const total = parseInt(ayushmanDetails.availableBalance.replace(/[^0-9]/g, ''));
    return (used / total) * 100;
  };

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold primary-grad">
              Ayushman Bharat Card
            </h1>
            {ayushmanDetails && (
              <p className="text-muted-foreground mt-1">
                Welcome back, {ayushmanDetails.beneficiaryName}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowDownloadDialog(true)}
            >
              <Download className="h-4 w-4" />
              Download Card
            </Button>
            <Button variant="destructive" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Emergency Help
            </Button>
          </div>
        </div>

        {/* Card Details Section */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {loading.details ? (
            <>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </>
          ) : ayushmanDetails ? (
            <>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Card Status</CardTitle>
                  <Shield className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {ayushmanDetails.status}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Valid until {ayushmanDetails.validUntil}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Available Balance
                  </CardTitle>
                  <BadgeIndianRupee className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ayushmanDetails.availableBalance}</div>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Used: {ayushmanDetails.usedAmount}</span>
                      <span className="text-muted-foreground">{calculateUsagePercentage().toFixed(1)}%</span>
                    </div>
                    <Progress value={calculateUsagePercentage()} className="h-1" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Family Members
                  </CardTitle>
                  <Users className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ayushmanDetails.familyMembers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Covered under this policy
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              Unable to fetch card details
            </div>
          )}
        </div>

        {/* Hospital Finder Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Find Nearby Hospitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by hospital name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading.hospitals ? (
              <div className="space-y-4">
                <LoadingHospital />
                <LoadingHospital />
                <LoadingHospital />
              </div>
            ) : nearbyHospitals.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <AnimatePresence>
                  <div className="space-y-4">
                    {filteredHospitals.map((hospital) => (
                      <motion.div
                        key={hospital.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 border rounded-lg bg-gradient-to-br from-card to-muted/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Hospital className="h-4 w-4 text-blue-500" />
                            {hospital.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm">{hospital.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4" />
                          {hospital.address}
                          <Badge variant="secondary" className="ml-2">
                            {hospital.distance}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Phone className="h-4 w-4" />
                          {hospital.phone}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {hospital.specialties.map((specialty, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                              <Stethoscope className="h-3 w-3 mr-1" />
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span>Current wait time: {hospital.waitTime}</span>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">View Details</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{hospital.name}</DialogTitle>
                                <DialogDescription>
                                  Hospital details and available services
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold">Contact Information</h4>
                                  <div className="flex items-center gap-2 text-sm mt-2">
                                    <Phone className="h-4 w-4" />
                                    {hospital.phone}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm mt-1">
                                    <MapPin className="h-4 w-4" />
                                    {hospital.address}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Available Specialties</h4>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {hospital.specialties.map((specialty, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      >
                                        {specialty}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Current Status</h4>
                                  <div className="flex items-center gap-4 text-sm mt-2">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4 text-yellow-500" />
                                      Wait time: {hospital.waitTime}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hospitals found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Claims Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.claims ? (
              <div className="space-y-4">
                <LoadingClaim />
                <LoadingClaim />
                <LoadingClaim />
              </div>
            ) : recentClaims.length > 0 ? (
              <AnimatePresence>
                <div className="space-y-4">
                  {recentClaims.map((claim) => (
                    <motion.div
                      key={claim.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <h3 className="font-semibold">{claim.hospital}</h3>
                        <p className="text-sm text-muted-foreground">
                          {claim.treatment} • {claim.date}
                        </p>
                        <p className="text-sm font-medium">₹{claim.amount.toLocaleString()}</p>
                      </div>
                      <Badge
                        variant={claim.status === "Approved" ? "secondary" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {claim.status === "Approved" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {claim.status}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent claims found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Download Card Dialog */}
        <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Download Ayushman Card</DialogTitle>
              <DialogDescription>
                Enter your Aadhaar number and registered mobile number to download your Ayushman card.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="aadhaar" className="text-sm font-medium">
                  Aadhaar Number
                </label>
                <Input
                  id="aadhaar"
                  placeholder="Enter 12-digit Aadhaar number"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  maxLength={12}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="mobile" className="text-sm font-medium">
                  Mobile Number
                </label>
                <Input
                  id="mobile"
                  placeholder="Enter 10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDownloadDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDownloadCard}
                disabled={isDownloading || !aadhaarNumber || !mobileNumber}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Card
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Ayushman; 