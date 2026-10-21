import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/ogCard";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "RevMeets — Find car events & meetups near you";

// Default share card for the homepage and any page without its own OG image.
export default function Image() {
  return ogCard({
    eyebrow: "Car Events",
    title: "Find your next car event",
    meta: "Car shows · track days · cruises · meets — across the UK",
  });
}
