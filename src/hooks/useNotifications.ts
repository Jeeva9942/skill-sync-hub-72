import { supabase } from "@/integrations/supabase/client";

interface CreateNotificationParams {
  userId: string;
  type: "new_bid" | "message_received" | "ticket_resolved" | "profile_view" | "project_status" | "new_review";
  title: string;
  message: string;
  data?: Record<string, any>;
}

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data = {}
}: CreateNotificationParams) => {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data
    });

  if (error) {
    console.error("Error creating notification:", error);
  }

  return { error };
};

// Helper functions for common notification types
export const notifyNewBid = async (
  projectOwnerId: string,
  freelancerName: string,
  projectTitle: string,
  bidAmount: number,
  projectId: string
) => {
  return createNotification({
    userId: projectOwnerId,
    type: "new_bid",
    title: "New Bid Received",
    message: `${freelancerName} placed a bid of ₹${bidAmount} on "${projectTitle}"`,
    data: { projectId, freelancerName, bidAmount }
  });
};

export const notifyMessageReceived = async (
  receiverId: string,
  senderName: string,
  messagePreview: string
) => {
  return createNotification({
    userId: receiverId,
    type: "message_received",
    title: "New Message",
    message: `${senderName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? "..." : ""}`,
    data: { senderName }
  });
};

export const notifyTicketResolved = async (
  userId: string,
  ticketSubject: string
) => {
  return createNotification({
    userId,
    type: "ticket_resolved",
    title: "Support Ticket Resolved",
    message: `Your support ticket "${ticketSubject}" has been resolved`,
    data: { ticketSubject }
  });
};

export const notifyProfileView = async (
  profileOwnerId: string,
  viewerName: string
) => {
  return createNotification({
    userId: profileOwnerId,
    type: "profile_view",
    title: "Profile Viewed",
    message: `${viewerName} viewed your profile`,
    data: { viewerName }
  });
};

export const notifyProjectStatusChange = async (
  userId: string,
  projectTitle: string,
  newStatus: string
) => {
  return createNotification({
    userId,
    type: "project_status",
    title: "Project Status Updated",
    message: `Your project "${projectTitle}" status changed to ${newStatus}`,
    data: { projectTitle, newStatus }
  });
};

export const notifyNewReview = async (
  userId: string,
  reviewerName: string,
  rating: number
) => {
  return createNotification({
    userId,
    type: "new_review",
    title: "New Review Received",
    message: `${reviewerName} left you a ${rating}-star review`,
    data: { reviewerName, rating }
  });
};