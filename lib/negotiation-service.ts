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
  runTransaction,
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
  const message = createMessage(acceptedBy, "accept", {
    price: 0,
    message: `${acceptedBy === "driver" ? "Driver" : "Customer"} accepted the offer`,
  });

  const { finalFare, otherParty, bookingRequestId } = await runTransaction(db, async (transaction) => {
    const negRef = doc(db, "negotiations", negotiationId);
    const negSnap = await transaction.get(negRef);
    if (!negSnap.exists()) throw new Error("Negotiation not found");

    const negData = negSnap.data() as Negotiation;
    if (negData.status !== "pending") {
      throw new Error("Negotiation is no longer pending");
    }

    const bookingRef = doc(db, "bookingRequests", negData.bookingRequestId);
    const lockRef = doc(db, "bookingRequests", negData.bookingRequestId, "_locks", "acceptance");
    const proposalRef = doc(db, "bookingRequests", negData.bookingRequestId, "proposals", negData.driverId);

    const bookingSnap = await transaction.get(bookingRef);
    if (!bookingSnap.exists()) throw new Error("Booking request not found");

    const bookingData = bookingSnap.data();
    const validPreAcceptance = ["searching", "offered", "price_pending"];
    if (!validPreAcceptance.includes(bookingData.status)) {
      throw new Error("Ride is no longer available");
    }

    // Check atomic acceptance lock
    const lockSnap = await transaction.get(lockRef);
    if (lockSnap.exists() && lockSnap.data()?.locked === true) {
      throw new Error("Acceptance is already in progress");
    }

    const nextVersion = (bookingData.version || 0) + 1;
    message.price = negData.currentOffer;

    // Acquire lock
    transaction.set(lockRef, {
      locked: true,
      lockedBy: negData.driverId,
      lockedAt: Timestamp.now(),
      negotiationId,
    });

    // Update negotiation
    transaction.update(negRef, {
      status: "accepted",
      resolvedAt: Timestamp.now(),
      messages: [...(negData.messages || []), message],
    });

    // Update booking request atomically
    transaction.update(bookingRef, {
      status: "accepted",
      fare: negData.currentOffer,
      finalFare: negData.currentOffer,
      acceptedBy: negData.driverId,
      acceptedDriverId: negData.driverId,
      acceptedAt: Timestamp.now(),
      version: nextVersion,
    });

    // Update proposal doc if present
    const proposalSnap = await transaction.get(proposalRef);
    if (proposalSnap.exists()) {
      transaction.update(proposalRef, {
        status: "accepted",
        price: negData.currentOffer,
        resolvedAt: Timestamp.now(),
      });
    }

    const recipient = acceptedBy === "driver" ? negData.customerId : negData.driverId;
    return {
      finalFare: negData.currentOffer,
      otherParty: recipient,
      bookingRequestId: negData.bookingRequestId,
    };
  });

  await notify(
    otherParty,
    bookingRequestId,
    "ride_request",
    `${acceptedBy === "driver" ? "Driver" : "Customer"} accepted the offer of KES ${finalFare}.`,
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
