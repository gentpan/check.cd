import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home/HomePage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/en")({
  head: () => pageHead("en"),
  component: function EnglishPage() {
    return <HomePage locale="en" />;
  },
});
