import type { Metadata } from "next";
import { LandingPage } from "../components/landing-page";

export const metadata: Metadata = {
  title: "SKIP \u2014 Stop Wasting Your Life Waiting",
  description:
    "SKIP is building a community-driven real-world activity intelligence ecosystem to help people make smarter everyday decisions.",
  openGraph: {
    title: "SKIP \u2014 Stop Wasting Your Life Waiting",
    description:
      "SKIP is building a community-driven real-world activity intelligence ecosystem to help people make smarter everyday decisions.",
    images: ["/og-image.png"]
  }
};

export default function Home() {
  return <LandingPage />;
}
