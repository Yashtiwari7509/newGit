import { Coordinate } from "recharts/types/util/types";

interface UserProps {
  firstName: string;
  lastName: string;
  email: string;
  _id: string;
}
interface cardsProps {
  title: string;
  value: string;
  trend: string;
  icon: undefined;
  trendDirection: undefined;
}
type locationProp = {
  coordinates: [number, number];
};
interface profileProps {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
  isOnline?: boolean;
  location?: locationProp;
}

export interface Review {
  _id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  userFirstName: string;
  userLastName: string;
}

interface doctorProfileProps {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isOnline?: boolean;
  location?: locationProp;
  specialization?: string;
  experience?: number;
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
  qualifications?: string[];
  availability?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}
interface doctor_UserProps {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isOnline?: boolean;
  location?: locationProp;
  specialization?: string;
  experience?: number;
  qualifications: string[];
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
  availability?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}

export type {
  UserProps,
  cardsProps,
  profileProps,
  doctorProfileProps,
  doctor_UserProps,
};
