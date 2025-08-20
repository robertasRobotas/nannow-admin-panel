export const reports = [
  {
    id: "rep_001",
    reported_by: {
      name: "Alice Johnson",
      imgUrl: "https://randomuser.me/api/portraits/women/12.jpg",
    },
    reported: {
      name: "Bob Smith",
      imgUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    isInvestigating: true,
    isSolved: false,
    createdAt: "Aug 1",
    resolvedAt: null,
    report:
      "The user repeatedly sent inappropriate messages in the group chat, despite multiple warnings. Several members complained about the content being offensive and disruptive. Screenshots were shared that clearly show repeated use of offensive language. The behavior escalated over time rather than improving. Moderators had to remove him temporarily to calm the chat down. Community members expressed concern that the harassment might continue if not addressed properly.",
  },
  {
    id: "rep_002",
    reported_by: {
      name: "Carlos Vega",
      imgUrl: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    reported: {
      name: "Diana Prince",
      imgUrl: "https://randomuser.me/api/portraits/women/8.jpg",
    },
    isInvestigating: false,
    isSolved: true,
    createdAt: "Jul 20",
    resolvedAt: "Jul 22",
    report:
      "The account appeared to be using fraudulent information to pass verification checks. Multiple inconsistencies were found in the documents that were uploaded. The name provided did not match the ID card, and the photo appeared edited. When asked for clarification, the user did not respond to messages. This raised suspicion that the profile was fake and potentially harmful. After review, the account was suspended and the report marked as solved.",
  },
  {
    id: "rep_003",
    reported_by: {
      name: "Evelyn Parker",
      imgUrl: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    reported: {
      name: "Frank Miller",
      imgUrl: "https://randomuser.me/api/portraits/men/78.jpg",
    },
    isInvestigating: false,
    isSolved: false,
    createdAt: "Aug 10",
    resolvedAt: null,
    report:
      "The reported user sent harassing messages late at night to multiple members. Victims described the behavior as intimidating and persistent. Attempts to block the user were circumvented with new accounts. Several screenshots were attached for evidence. The behavior violates community rules around respect and safety. Immediate review is needed to prevent further escalation.",
  },
  {
    id: "rep_004",
    reported_by: {
      name: "Grace Lee",
      imgUrl: "https://randomuser.me/api/portraits/women/23.jpg",
    },
    reported: {
      name: "Henry Adams",
      imgUrl: "https://randomuser.me/api/portraits/men/91.jpg",
    },
    isInvestigating: true,
    isSolved: false,
    createdAt: "Aug 15",
    resolvedAt: null,
    report:
      "Unusual login attempts were detected from multiple locations in a short period of time. The account displayed sudden changes in activity, such as sending large numbers of messages. Friends reported receiving strange links that appeared malicious. The user denied responsibility and claimed their account was compromised. Security logs suggest unauthorized access. An investigation is ongoing to confirm whether the account was hacked or misused intentionally.",
  },
  {
    id: "rep_005",
    reported_by: {
      name: "Isabella Rossi",
      imgUrl: "https://randomuser.me/api/portraits/women/34.jpg",
    },
    reported: {
      name: "Jack Wilson",
      imgUrl: "https://randomuser.me/api/portraits/men/56.jpg",
    },
    isInvestigating: false,
    isSolved: true,
    createdAt: "Jul 28",
    resolvedAt: "Jul 29",
    report:
      "The reported profile contained an inappropriate and offensive profile picture. Several users flagged the image as explicit and unsuitable for the platform. Upon review, moderators confirmed that it violated the guidelines. The image was removed immediately, and the user was contacted about the violation. The user acknowledged the mistake and agreed to comply in the future. The report has been resolved and the account remains under observation.",
  },
];
