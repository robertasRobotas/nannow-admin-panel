export type CriminalCheckUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isProvider: boolean;
  providerId: string;
  createdAt: string;
  criminalRecordStatus: "APPROVED" | "REJECTED" | "PENDING" | "NOT_SUBMITTED";
};

export interface Provider {
  _id: string;
  id: string;
  userId: string;
  isCanTakeCareOfNewborns: boolean;
  isCanTakeCareOfBabys: boolean;
  isCanTakeCareOfKids: boolean;
  isOffersInHomeCare: boolean;
  intro: string;
  qualitiesIds: string[];
  availableToWatch: string[];
  availableDays: string; // e.g. "NONE"
  badgesIds: string[];
  languages: string[];
  addressesIds: string[];
  operationCountry: string;
  isAvailableStatus: boolean;
  criminalRecordStatusAdminNotes: string[];
  receivedReviewsIds: string[]; // note: appears twice in your data, kept once
  criminalRecordDocUrls: string[];
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  __v: number;
  defaultAddressId: string;
  leftReviewIds: string[];
  positiveReviewsCount: number;
  rating: number;
  receivedReviewIds: string[];
  unavailablePeriods: string[];
  criminalRecordCode: string;
  criminalRecordVerifiedAt: string; // ISO date
  criminalRecordChangedAt: string;
  criminalRecordVerifiedType: string; // e.g. "QR"
  criminalRecordStatus: "APPROVED" | "REJECTED" | "PENDING" | "NOT_SUBMITTED";
}

export interface User {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isUserVerified: boolean;
  middleName: string;
  phoneNumber: string;
  country: string;
  isProvider: boolean;
  providerId: string;
  imgUrl: string;
  isCustomImgAdded: boolean;
  birthDate: string; // ISO date
  isDeleted: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  password: string | null;
  isEmailConfirmed: boolean;
  isPhoneNumberConfirmed: boolean;
  isAcceptedTerms: boolean;
  documentsIds: string[];
  currentMode: "CLIENT" | "PROVIDER" | string;
  roles: string[];
  __v: number;
  clientId: string;
  isEmailVerified: boolean;
  emailVerificationCode: string;
  emailVerificationCodeExpiresAt: string; // ISO date
  emailVerificationMethod: "MANUAL" | "AUTO" | string;
  chatIds: string[];
  provider: Provider;
}
