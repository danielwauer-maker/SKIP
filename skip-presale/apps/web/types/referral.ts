export type XpActionType =
  | "REGISTER_WALLET"
  | "CONNECT_WALLET_DAILY"
  | "COMPLETE_TESTNET_BUY"
  | "REFER_SIGNUP"
  | "REFER_QUALIFIED"
  | "JOIN_COMMUNITY"
  | "BUG_REPORT"
  | "FEEDBACK_SUBMITTED"
  | "MEME_SUBMISSION"
  | "INVITE_1_FRIEND"
  | "INVITE_5_FRIENDS"
  | "SHARE_SKIP";

export type RankInfo = {
  name: string;
  minXp: number;
  badgeClass: string;
};

export type ReferralStats = {
  invited: number;
  qualified: number;
  pending: number;
  xpFromReferrals: number;
};

export type QuestView = {
  key: string;
  title: string;
  description: string;
  points: number;
  status: "AVAILABLE" | "PENDING" | "APPROVED" | "REJECTED";
  automatic: boolean;
  manualLabel?: string;
};
