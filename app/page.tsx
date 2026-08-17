import type { Metadata } from "next";
import CreatorPoolApp from "./CreatorPoolApp";

export const metadata: Metadata = {
  title: "Creator Pool Hub",
  description: "Creator operations for Meitu, BeautyCam, and Wink in Indonesia.",
};

export default function Home() {
  return <CreatorPoolApp />;
}
