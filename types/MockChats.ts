export type ChatMessage = {
  id: number;
  text: string;
  timestamp: string; // e.g. "Aug 12"
};

export type ChatUser = {
  id: string;
  name: string;
  imgUrl: string;
  isVerified: boolean;
  isCrown: boolean;
  isVoicechat: boolean;
  messages: ChatMessage[];
};
