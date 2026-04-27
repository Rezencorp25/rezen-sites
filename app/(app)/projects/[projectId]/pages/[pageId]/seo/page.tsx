import { Search } from "lucide-react";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default function SeoEditorPage() {
  return (
    <ModulePlaceholder
      title="SEO Editor"
      description="Meta tags, Open Graph, Google Search + Social previews, AI fill."
      icon={Search}
      phase="F4"
    />
  );
}
