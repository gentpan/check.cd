import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home/HomePage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/russia")({
  head: () => pageHead("ru"),
  component: function RussiaPage() {
    return <HomePage locale="ru" />;
  },
});
