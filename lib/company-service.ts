import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Company } from "./types";

export async function getCompanyDetail(companyId: string): Promise<Company | null> {
  try {
    const docSnap = await getDoc(doc(db, "companies", companyId));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Company;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching company:", error);
    }
    return null;
  }
}
