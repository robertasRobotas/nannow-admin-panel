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

export type Client = {
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

export type ClientDetails = {
  client: {
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
  documents: any[];
  reviews: {
    given: any[];
    received: {
      stats: {
        count: number;
      };
      latest: any[];
    };
  };
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
  };
  chats: ChatType[];
};
