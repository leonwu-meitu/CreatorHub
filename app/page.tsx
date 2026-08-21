import type { Metadata } from "next";
import CreatorPoolApp from "./CreatorPoolApp";

export const metadata: Metadata = {
  title: "Join Meitu Indonesia's official CreatorHub.",
  description:
    "Apply to join Meitu Indonesia's official CreatorHub for Meitu, BeautyCam, and Wink.",
};

export default function Home() {
  return <CreatorPoolApp />;
}
