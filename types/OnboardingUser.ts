export type OnboardingMode = "CLIENT" | "PROVIDER";

export type OnboardingStep =
  | "USER_VERIFIED"
  | "PROFILE_PICTURE"
  | "ADDRESS"
  | "CHILD"
  | "ABOUT_ME"
  | "CRIMINAL_RECORD"
  | "BANK_ONBOARDING"
  | "KYC";

export type OnboardingNotFinishedUser = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  imgUrl?: string;
  currentMode: OnboardingMode;
  profileId?: string;
  remainingSteps: OnboardingStep[];
  remainingStepsCount: number;
};

export type GetOnboardingNotFinishedUsersResponse = {
  items: OnboardingNotFinishedUser[];
  total: number;
  startIndex: number;
  pageSize: number;
};

