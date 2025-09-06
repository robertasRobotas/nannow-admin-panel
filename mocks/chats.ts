import { ChatUser } from "@/types/Chats";

export const mockChatData: ChatUser[] = [
  {
    id: "1",
    name: "Luna Star",
    imgUrl: "https://randomuser.me/api/portraits/women/68.jpg",
    isVerified: true,
    isCrown: false,
    isVoicechat: true,
    messages: [
      {
        id: "101",
        text: "Hey everyone! How’s your day going?",
        timestamp: "Aug 12",
        isSent: false,
      },
      {
        id: "102",
        text: "Pretty good, just got back from the park 🌳",
        timestamp: "Aug 12",
        isSent: true,
      },
      {
        id: "103",
        text: "I’m just chilling with some coffee ☕",
        timestamp: "Aug 12",
        isSent: false,
      },
    ],
  },
  {
    id: "2",
    name: "Max Blaze",
    imgUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    isVerified: false,
    isCrown: true,
    isVoicechat: false,
    messages: [
      {
        id: "201",
        text: "Yo Luna, just finished my workout 💪",
        timestamp: "Aug 12",
        isSent: false,
      },
      {
        id: "202",
        text: "Nice! What routine did you do?",
        timestamp: "Aug 12",
        isSent: true,
      },
      {
        id: "203",
        text: "Coffee sounds great though haha",
        timestamp: "Aug 12",
        isSent: false,
      },
    ],
  },
  {
    id: "3",
    name: "Nova Skye",
    imgUrl: "https://randomuser.me/api/portraits/women/12.jpg",
    isVerified: true,
    isCrown: false,
    isVoicechat: false,
    messages: [
      {
        id: "301",
        text: "Good morning, crew 🌞",
        timestamp: "Aug 12",
        isSent: false,
      },
      {
        id: "302",
        text: "Morning Nova! Any plans today?",
        timestamp: "Aug 12",
        isSent: true,
      },
      {
        id: "303",
        text: "Who’s up for some gaming later?",
        timestamp: "Aug 12",
        isSent: false,
      },
    ],
  },
  {
    id: "4",
    name: "Rex Hunter",
    imgUrl: "https://randomuser.me/api/portraits/men/55.jpg",
    isVerified: false,
    isCrown: false,
    isVoicechat: true,
    messages: [
      {
        id: "401",
        text: "Count me in, Nova 🎮",
        timestamp: "Aug 12",
        isSent: false,
      },
      {
        id: "402",
        text: "Awesome, let’s squad up at 8!",
        timestamp: "Aug 12",
        isSent: true,
      },
    ],
  },
];
