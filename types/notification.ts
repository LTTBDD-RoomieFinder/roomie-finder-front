export type NotificationType =
  | "REQUEST_RECEIVED"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "NEW_MESSAGE";

export type NotificationItem = {
  id: number;
  actorId?: number | null;
  type: NotificationType;
  title: string;
  content: string;
  referenceId?: number | null;
  read: boolean;
  createdAt: string;
  updatedAt?: string | null;
};
