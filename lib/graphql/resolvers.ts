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
} from "firebase/firestore";

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
  },
};
