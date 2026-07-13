import { GraphQLContext } from "./context";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  startAfter,
} from "firebase/firestore";
import { COLLECTIONS } from "@/lib/firestore-constants";

interface PaginationArgs {
  limit?: number;
  offset?: number;
}

interface VehicleFilters {
  status?: string;
  search?: string;
}

function getCompanyId(ctx: GraphQLContext): string {
  if (!ctx.companyId) throw new Error("Unauthorized: no company context");
  return ctx.companyId;
}

function requireAdmin(ctx: GraphQLContext): void {
  if (ctx.role !== "admin") throw new Error("Forbidden: admin only");
}

export const resolvers = {
  Query: {
    vehicles: async (
      _: unknown,
      args: PaginationArgs & VehicleFilters,
      ctx: GraphQLContext
    ) => {
      const companyId = getCompanyId(ctx);
      const pageSize = Math.min(args.limit ?? 20, 100);
      const vehiclesRef = collection(db, "vehicles");

      let q = query(
        vehiclesRef,
        where("companyId", "==", companyId),
        orderBy("createdAt", "desc")
      );

      if (args.status && args.status !== "all") {
        q = query(
          vehiclesRef,
          where("companyId", "==", companyId),
          where("status", "==", args.status),
          orderBy("createdAt", "desc")
        );
      }

      const snapshot = await getDocs(q);
      let items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (args.search) {
        const search = args.search.toLowerCase();
        items = items.filter(
          (v: Record<string, unknown>) =>
            (v.plateNumber as string)?.toLowerCase().includes(search) ||
            (v.make as string)?.toLowerCase().includes(search) ||
            (v.model as string)?.toLowerCase().includes(search)
        );
      }

      const total = items.length;
      const offset = args.offset ?? 0;
      const paginated = items.slice(offset, offset + pageSize);

      return {
        items: paginated,
        total,
        hasMore: offset + pageSize < total,
      };
    },

    vehicle: async (_: unknown, { id }: { id: string }) => {
      const snap = await getDoc(doc(db, "vehicles", id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    },

    vendorDashboard: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const companyId = getCompanyId(ctx);
      const vehiclesRef = collection(db, "vehicles");
      const hireRef = collection(db, "hireRequests");

      const [vehiclesSnap, hireSnap] = await Promise.all([
        getDocs(query(vehiclesRef, where("companyId", "==", companyId))),
        getDocs(query(hireRef, where("companyId", "==", companyId))),
      ]);

      const vehicles = vehiclesSnap.docs.map((d) => d.data());
      const hires = hireSnap.docs.map((d) => d.data());

      return {
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter((v) => v.status === "available").length,
        onTripVehicles: vehicles.filter((v) => v.status === "on_trip").length,
        draftVehicles: vehicles.filter((v) => v.status === "draft").length,
        totalHireRequests: hires.length,
        activeHires: hires.filter((h) => h.status === "active").length,
        pendingApprovals: hires.filter((h) => h.status === "pending").length,
      };
    },

    hireRequests: async (
      _: unknown,
      args: PaginationArgs & { status?: string },
      ctx: GraphQLContext
    ) => {
      const companyId = getCompanyId(ctx);
      const pageSize = Math.min(args.limit ?? 20, 100);
      const hireRef = collection(db, "hireRequests");

      let q = query(
        hireRef,
        where("companyId", "==", companyId),
        orderBy("createdAt", "desc")
      );

      if (args.status && args.status !== "all") {
        q = query(
          hireRef,
          where("companyId", "==", companyId),
          where("status", "==", args.status),
          orderBy("createdAt", "desc")
        );
      }

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const total = items.length;
      const offset = args.offset ?? 0;

      return {
        items: items.slice(offset, offset + pageSize),
        total,
        hasMore: offset + pageSize < total,
      };
    },

    adminCompanies: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAdmin(ctx);
      const snap = await getDocs(
        query(collection(db, "companies"), orderBy("createdAt", "desc"))
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    appCrashes: async (
      _: unknown,
      args: { platform?: string; severity?: string; status?: string },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);

      const constraints: unknown[] = [
        orderBy("timestamp", "desc"),
        firestoreLimit(200),
      ];

      if (args.platform && args.platform !== "all") {
        constraints.unshift(where("platform", "==", args.platform));
      }
      if (args.severity && args.severity !== "all") {
        constraints.unshift(where("severity", "==", args.severity));
      }
      if (args.status === "open") {
        constraints.unshift(where("resolved", "==", false));
      } else if (args.status === "resolved") {
        constraints.unshift(where("resolved", "==", true));
      }

      const q = query(collection(db, COLLECTIONS.APP_CRASHES), ...constraints);
      const snap = await getDocs(q);

      return snap.docs.map((d) => {
        const data = d.data();
        const errorMessage: string = data.errorMessage || data.message || "";
        const screen: string = data.screen || "";
        const userAction: string = data.userAction || "";

        let category = "ui";
        const lower = errorMessage.toLowerCase();
        const lowerScreen = screen.toLowerCase();
        const lowerAction = userAction.toLowerCase();
        if (
          lower.includes("payment") || lower.includes("mpesa") || lower.includes("transaction") ||
          lowerScreen.includes("payment") || lowerAction.includes("payment")
        ) {
          category = "payment";
        } else if (
          lower.includes("booking") || lower.includes("ride") || lower.includes("driver") ||
          lowerScreen.includes("book") || lowerScreen.includes("ride") ||
          lowerAction.includes("booking") || lowerAction.includes("ride")
        ) {
          category = "booking";
        } else if (
          lower.includes("auth") || lower.includes("session") || lower.includes("login") || lower.includes("signup")
        ) {
          category = "auth";
        } else if (
          lower.includes("network") || lower.includes("fetch") || lower.includes("timeout") || lower.includes("connection")
        ) {
          category = "network";
        }

        return {
          id: d.id,
          message: data.errorMessage || data.message || null,
          stack: data.errorStack || data.stack || null,
          errorType: data.errorType || null,
          errorName: data.errorName || null,
          userId: data.userId || null,
          userRole: data.userRole || null,
          platform: data.platform || "unknown",
          appVersion: data.appVersion || null,
          osVersion: data.osVersion || null,
          deviceModel: data.deviceModel || null,
          buildNumber: data.buildNumber || null,
          screen: data.screen || null,
          userAction: data.userAction || null,
          componentStack: data.componentStack || null,
          sessionId: data.sessionId || null,
          severity: data.severity || "low",
          isFatal: data.isFatal ?? false,
          resolved: data.resolved ?? false,
          resolvedBy: data.resolvedBy || null,
          resolvedAt: data.resolvedAt || null,
          timestamp: data.timestamp,
          count: data.count || 1,
          category,
        };
      });
    },

    shareLinks: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAdmin(ctx);
      const snap = await getDocs(
        query(collection(db, COLLECTIONS.SHARE_LINKS), orderBy("createdAt", "desc"))
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    auditLogs: async (
      _: unknown,
      args: { category?: string; severity?: string; limit?: number; cursor?: string },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      const pageSize = Math.min(args.limit ?? 30, 100);
      const constraints: unknown[] = [
        orderBy("timestamp", "desc"),
        firestoreLimit(pageSize),
      ];

      if (args.category && args.category !== "all") {
        constraints.unshift(where("category", "==", args.category));
      }
      if (args.severity && args.severity !== "all") {
        constraints.unshift(where("severity", "==", args.severity));
      }
      if (args.cursor) {
        const cursorDoc = await getDoc(doc(db, COLLECTIONS.ADMIN_AUDIT_EVENTS, args.cursor));
        if (cursorDoc.exists()) {
          constraints.push(startAfter(cursorDoc));
        }
      }

      const q = query(collection(db, COLLECTIONS.ADMIN_AUDIT_EVENTS), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const lastDoc = snap.docs[snap.docs.length - 1];

      return {
        items,
        total: items.length,
        hasMore: snap.docs.length === pageSize,
        cursor: lastDoc?.id ?? null,
      };
    },

    customerDashboard: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.uid) throw new Error("Unauthorized");
      const q = query(
        collection(db, "bookingRequests"),
        where("customerId", "==", ctx.uid),
        orderBy("createdAt", "desc"),
        firestoreLimit(5)
      );
      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      const active = bookings.filter(
        (b: Record<string, unknown>) =>
          !b.rideStatus ||
          ["pending", "confirmed", "en_route", "arrived", "in_progress"].includes(
            b.rideStatus as string
          )
      ).length;
      const completed = bookings.filter(
        (b: Record<string, unknown>) => b.rideStatus === "completed"
      ).length;

      return {
        recentBookings: bookings,
        total: snapshot.size,
        active,
        completed,
      };
    },

    driverBookings: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.uid) throw new Error("Unauthorized");
      const q = query(
        collection(db, "bookingRequests"),
        where("acceptedBy", "==", ctx.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    companyProfile: async (_: unknown, args: { id?: string }, ctx: GraphQLContext) => {
      const companyId = args.id || ctx.companyId;
      if (!companyId) throw new Error("Unauthorized");
      const snap = await getDoc(doc(db, "companies", companyId));
      if (!snap.exists()) throw new Error("Company not found");
      const data = snap.data();
      return {
        id: snap.id,
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        logoUrl: data.logoUrl || "",
        incorporationDocUrl: data.incorporationDocUrl || "",
        address:
          typeof data.officeLocation === "string"
            ? data.officeLocation
            : data.officeLocation?.address || "",
        bio: data.bio || "",
      };
    },
  },

  Mutation: {
    publishVehicle: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const companyId = getCompanyId(ctx);
      const vehicleRef = doc(db, "vehicles", id);
      const snap = await getDoc(vehicleRef);

      if (!snap.exists()) throw new Error("Vehicle not found");
      if (snap.data().companyId !== companyId) throw new Error("Forbidden");

      await updateDoc(vehicleRef, {
        status: "available",
        updatedAt: serverTimestamp(),
      });

      return { id, ...snap.data(), status: "available" };
    },

    batchPublishVehicles: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const companyId = getCompanyId(ctx);
      const vehiclesRef = collection(db, "vehicles");
      const q = query(
        vehiclesRef,
        where("companyId", "==", companyId),
        where("status", "==", "draft")
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return { published: 0, failed: 0 };

      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.update(d.ref, { status: "available", updatedAt: serverTimestamp() });
      });
      await batch.commit();

      return { published: snapshot.size, failed: 0 };
    },

    deleteVehicle: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const companyId = getCompanyId(ctx);
      const vehicleRef = doc(db, "vehicles", id);
      const snap = await getDoc(vehicleRef);

      if (!snap.exists()) throw new Error("Vehicle not found");
      if (snap.data().companyId !== companyId) throw new Error("Forbidden");
      if (snap.data().status !== "draft") throw new Error("Can only delete draft vehicles");

      await deleteDoc(vehicleRef);
      return true;
    },

    updateCompanyStatus: async (
      _: unknown,
      args: { id: string; status: string },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      const companyRef = doc(db, "companies", args.id);
      const snap = await getDoc(companyRef);
      if (!snap.exists()) throw new Error("Company not found");

      await updateDoc(companyRef, {
        status: args.status,
        updatedAt: serverTimestamp(),
        updatedBy: ctx.uid,
      });

      if (args.status === "active") {
        const vSnap = await getDocs(
          query(
            collection(db, "vehicles"),
            where("companyId", "==", args.id),
            where("status", "==", "draft")
          )
        );
        if (!vSnap.empty) {
          const batch = writeBatch(db);
          vSnap.docs.forEach((v) =>
            batch.update(v.ref, { status: "active", updatedAt: serverTimestamp() })
          );
          await batch.commit();
        }
      }

      return { id: args.id, ...snap.data(), status: args.status };
    },

    toggleCorporate: async (
      _: unknown,
      args: { id: string; isCorporate: boolean },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      const companyRef = doc(db, "companies", args.id);
      const snap = await getDoc(companyRef);
      if (!snap.exists()) throw new Error("Company not found");

      await updateDoc(companyRef, {
        isCorporate: args.isCorporate,
        updatedAt: serverTimestamp(),
      });

      return { id: args.id, ...snap.data(), isCorporate: args.isCorporate };
    },

    resolveCrash: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAdmin(ctx);
      const crashRef = doc(db, COLLECTIONS.APP_CRASHES, id);
      const snap = await getDoc(crashRef);
      if (!snap.exists()) throw new Error("Crash not found");

      await updateDoc(crashRef, { resolved: true, resolvedAt: new Date() });
      return { id, ...snap.data(), resolved: true };
    },

    toggleShareLinkActive: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAdmin(ctx);
      const linkRef = doc(db, COLLECTIONS.SHARE_LINKS, id);
      const snap = await getDoc(linkRef);
      if (!snap.exists()) throw new Error("Share link not found");

      const newActive = !snap.data().active;
      await updateDoc(linkRef, { active: newActive });
      return { id, ...snap.data(), active: newActive };
    },

    deleteShareLink: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAdmin(ctx);
      const linkRef = doc(db, COLLECTIONS.SHARE_LINKS, id);
      const snap = await getDoc(linkRef);
      if (!snap.exists()) throw new Error("Share link not found");

      await deleteDoc(linkRef);
      return true;
    },

    updateCompanyProfile: async (
      _: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext
    ) => {
      const companyId = (args.input.id as string) || ctx.companyId;
      if (!companyId) throw new Error("Unauthorized");

      const companyRef = doc(db, "companies", companyId);
      await updateDoc(companyRef, {
        name: args.input.name,
        phone: args.input.phone || "",
        email: args.input.email || "",
        logoUrl: args.input.logoUrl || "",
        incorporationDocUrl: args.input.incorporationDocUrl || "",
        bio: args.input.bio || "",
        "officeLocation.address": args.input.address || "",
        updatedAt: serverTimestamp(),
      });

      const snap = await getDoc(companyRef);
      const data = snap.data()!;
      return {
        id: snap.id,
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        logoUrl: data.logoUrl || "",
        incorporationDocUrl: data.incorporationDocUrl || "",
        address:
          typeof data.officeLocation === "string"
            ? data.officeLocation
            : data.officeLocation?.address || "",
        bio: data.bio || "",
      };
    },
  },
};
