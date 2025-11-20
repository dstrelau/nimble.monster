import { SSRSafe } from "@/components/SSRSafe";
import OBRClientView from "./OBRClientView";

export default function OwlbearExtensionPage() {
  return (
    <SSRSafe>
      <OBRClientView />
    </SSRSafe>
  );
}
