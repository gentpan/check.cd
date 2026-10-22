import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home/HomePage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => pageHead("zh"),
  component: function IndexPage() {
    return <HomePage locale="zh" />;
  },
});
