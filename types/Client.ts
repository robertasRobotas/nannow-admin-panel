//FOR MOCKS
/*
export type Client = {
  id: string;
  name: string;
  profileimg: string;
  balance: number;
  completed_orders: number;
  active_orders: number;
  cancelled_orders: number;
  messages: number;
  children: number;
  reviews: number;
  addresses: number;
  badges: number;
  profile_completion: number;
};
*/

import { ChatType } from "./Chats";
import { ReviewType } from "./Reviews";

export type User = {
  _id: string;
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  imgUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type UserDetails = {
  provider?: {
    id: string;
    userId: string;
    totalEarnings: number;
    badgesIds?: string[];
    criminalRecord?: {
      status: string;
      statusAdminNotes: string[];
      code: string;
      verifiedAt: string;
      verifiedType: string;
    };
    specialSkills?: {
      firstAid?: {
        documentId?: string;
        status?: string; // e.g. 'VERIFYING' | 'VERIFIED'
        verifiedAt?: string;
        appliedAt?: string;
        verifiedByAdminId?: string;
      };
      teacher?: {
        documentId?: string;
        status?: string;
        verifiedAt?: string;
        appliedAt?: string;
        verifiedByAdminId?: string;
      };
      professionalNanny?: {
        documentId?: string;
        status?: string;
        appliedAt?: string;
        verifiedAt?: string;
        verifiedByAdminId?: string;
      };
      artEducator?: {
        documentId?: string;
        status?: string;
        verifiedAt?: string;
        appliedAt?: string;
        verifiedByAdminId?: string;
      };
      language?: {
        documentId?: string;
        status?: string;
        verifiedAt?: string;
        appliedAt?: string;
        verifiedByAdminId?: string;
      };
      psychologist?: {
        documentId?: string;
        status?: string;
        verifiedAt?: string;
        appliedAt?: string;
        verifiedByAdminId?: string;
      };
      sportsCoach?: {
        documentId?: string;
        status?: string;
        verifiedAt?: string;
        appliedAt?: string;
        verifiedByAdminId?: string;
      };
    };
  };
  client?: {
    id: string;
    userId: string;
    languages: string[];
    badgesIds: string[];
    animals: string[];
    rating: number;
    positiveReviewsCount: number;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
  };
  addresses: {
    id: string;
    latitude: number;
    longitude: number;
    location: {
      type: string;
      coordinates: [number, number];
    };
    country: string;
    city: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    createdAt: string;
    updatedAt: string;
    isDefault: boolean;
  }[];
  children: {
    id: string;
    gender: string;
    name: string;
    birthDate: string;
    allergiesIds: string[];
    disabilitiesIds: string[];
  }[];
  savedProviders: {
    id: string;
    userId: string;
    operationCountry: string;
    isAvailableStatus: boolean;
    rating: number;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      imgUrl: string;
    };
  }[];
  documents: {
    id: string;
    url: string;
    type: string;
    createdAt: string;
    updatedAt: string;
  }[];
  receivedReviews: ReviewType[];
  givenReviews: ReviewType[];
  orders: {
    countsByStatus: {
      count: number;
      status: string;
    }[];
    lastOrder: {
      id: string;
      startsAt: string;
      endsAt: string;
      status: string;
      totalClientPrice: number | null;
    };
    totals: {
      count: number;
      totalSpend: number;
    };
  };
  defaultAddress: {
    id: string;
    latitude: number;
    longitude: number;
    location: {
      type: string;
      coordinates: [number, number];
    };
    country: string;
    city: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    createdAt: string;
    updatedAt: string;
    isDefault: boolean;
  };
  chatCount: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    imgUrl: string;
    isEmailVerified: boolean;
    isUserVerified: boolean;
    phoneNumber: string;
    country: string;
    roles: string[];
    createdAt: string;
    pushToken?: string;
  };
  chats: ChatType[];
};
