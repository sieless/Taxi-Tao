// lib/negotiation-service.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Negotiation, NegotiationMessage } from "./types";
import { createNotification } from "./notification-service";

/* -----------------------------------------------------
 * Helpers
 * --------------------------------------------------- */

function now() {
  return Timestamp.now();
}

function createMessage(
  sender: "customer" | "driver",
  type: NegotiationMessage["type"],
  payload: Partial<NegotiationMessage>
): NegotiationMessage {
  return {
    sender,
    type,
    timestamp: now(),
    ...payload,
  } as NegotiationMessage;
}

async function getNegotiationOrFail(id: string): Promise<Negotiation> {
  const negotiation = await getNegotiation(id);
  if (!negotiation) throw new Error("Negotiation not found");
  return negotiation;
}

async function notify(
  recipientId: string | null,
  bookingRequestId: string,
  type: string,
  body: string,
  data?: Record<string, unknown>
) {
  if (!recipientId) return;
  await createNotification(recipientId, bookingRequestId, type as any, body, data);
}

/* -----------------------------------------------------
 * Create Negotiation
 * --------------------------------------------------- */

export async function createNegotiation(
  bookingRequestId: string,
  customerId: string | null,
  customerName: string,
  customerPhone: string,
  driverId: string,
  initialPrice: number,
  proposedPrice: number
): Promise<string> {
  const negotiationRef = doc(collection(db, "negotiations"));

  const firstMessage = createMessage("customer", "offer", {
    price: proposedPrice,
    message: `Customer offered KES ${proposedPrice}`,
  });

  const negotiation: Omit<Negotiation, "id"> = {
    bookingRequestId,
    customerId,
    customerName,
    customerPhone,
    driverId,
    initialPrice,
    proposedPrice,
    currentOffer: proposedPrice,
    status: "pending",
    messages: [firstMessage],
    createdAt: now(),
    expiresAt: Timestamp.fromMillis(Date.now() + 15 * 60 * 1000), // 15 min
  };

  await setDoc(negotiationRef, negotiation);

  await notify(
    customerId,
    bookingRequestId,
    "fare_change",
    `Driver proposed a new fare: KES ${proposedPrice}.`,
    { action: "negotiate", negotiationId: negotiationRef.id }
  );

  return negotiationRef.id;
}

/* -----------------------------------------------------
 * Fetch Negotiation
 * --------------------------------------------------- */

export async function getNegotiation(
  negotiationId: string
): Promise<Negotiation | null> {
  const snap = await getDoc(doc(db, "negotiations", negotiationId));
  return snap.exists()
    ? ({ id: snap.id, ...snap.data() } as Negotiation)
    : null;
}

/* -----------------------------------------------------
 * Get Driver Negotiations
 * --------------------------------------------------- */

export async function getDriverNegotiations(
  driverId: string
): Promise<Negotiation[]> {
  const q = query(
    collection(db, "negotiations"),
    where("driverId", "==", driverId),
    where("status", "==", "pending")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Negotiation));
}

/* -----------------------------------------------------
 * Accept Offer
 * --------------------------------------------------- */

export async function acceptOffer(
  negotiationId: string,
  acceptedBy: "customer" | "driver"
): Promise<void> {
  const negotiation = await getNegotiationOrFail(negotiationId);

  const message = createMessage(acceptedBy, "accept", {
    price: negotiation.currentOffer,
    message: `${acceptedBy === "driver" ? "Driver" : "Customer"} accepted the offer`,
  });

  await updateDoc(doc(db, "negotiations", negotiationId), {
    status: "accepted",
    resolvedAt: now(),
    messages: [...negotiation.messages, message],
  });

  const otherParty =
    acceptedBy === "driver" ? negotiation.customerId : negotiation.driverId;

  await notify(
    otherParty,
    negotiation.bookingRequestId,
    "ride_request",
    `${acceptedBy === "driver" ? "Driver" : "Customer"} accepted the offer of KES ${negotiation.currentOffer}.`,
    { action: "view_booking" }
  );
}

/* -----------------------------------------------------
 * Decline Offer
 * --------------------------------------------------- */

export async function declineOffer(
  negotiationId: string,
  declinedBy: "customer" | "driver",
  reason?: string
): Promise<void> {
  const negotiation = await getNegotiationOrFail(negotiationId);

  const message = createMessage(declinedBy, "decline", {
    message: reason ?? `${declinedBy === "driver" ? "Driver" : "Customer"} declined the offer`,
  });

  await updateDoc(doc(db, "negotiations", negotiationId), {
    status: "declined",
    resolvedAt: now(),
    messages: [...negotiation.messages, message],
  });

  const otherParty =
    declinedBy === "driver" ? negotiation.customerId : negotiation.driverId;

  await notify(
    otherParty,
    negotiation.bookingRequestId,
    "ride_request",
    `${declinedBy === "driver" ? "Driver" : "Customer"} declined the offer.`,
    { action: "view_booking" }
  );
}

/* -----------------------------------------------------
 * Counter Offer
 * --------------------------------------------------- */

export async function counterOffer(
  negotiationId: string,
  counterBy: "customer" | "driver",
  newPrice: number,
  msg?: string
): Promise<void> {
  const negotiation = await getNegotiationOrFail(negotiationId);

  const message = createMessage(counterBy, "counter", {
    price: newPrice,
    message:
      msg ??
      `${counterBy === "driver" ? "Driver" : "Customer"} counter-offered KES ${newPrice}`,
  });

  await updateDoc(doc(db, "negotiations", negotiationId), {
    status: "counter_offered",
    currentOffer: newPrice,
    messages: [...negotiation.messages, message],
  });

  const otherParty =
    counterBy === "driver" ? negotiation.customerId : negotiation.driverId;

  await notify(
    otherParty,
    negotiation.bookingRequestId,
    "fare_change",
    `${counterBy === "driver" ? "Driver" : "Customer"} counter-offered KES ${newPrice}.`,
    { action: "negotiate", negotiationId }
  );
}

/* -----------------------------------------------------
 * Expiration Check
 * --------------------------------------------------- */

export async function checkExpiration(
  negotiationId: string
): Promise<boolean> {
  const negotiation = await getNegotiation(negotiationId);
  if (!negotiation) return true;

  const expireTime =
    negotiation.expiresAt instanceof Date
      ? negotiation.expiresAt.getTime()
      : negotiation.expiresAt.toMillis();

  const expired = Date.now() > expireTime && negotiation.status === "pending";
  if (!expired) return false;

  await updateDoc(doc(db, "negotiations", negotiationId), {
    status: "expired",
    resolvedAt: now(),
  });

  return true;
}
