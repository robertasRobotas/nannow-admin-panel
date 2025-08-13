export type ChatMessage = {
  id: string;
  text: string;
  timestamp: string; // e.g. "Aug 12"
  isSent: boolean; // true = sent by me, false = received
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
