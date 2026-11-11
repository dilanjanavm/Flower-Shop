import type { Metadata } from "next";
import { CustomBouquetView } from "@/components/checkout/CustomBouquetView";

export const metadata: Metadata = {
  title: "Design your own bouquet",
  description: "Pick flowers from our gallery, choose your wrap and ribbon, and request a quotation from our florist.",
};

export default function CustomBouquetPage() {
  return <CustomBouquetView />;
}
