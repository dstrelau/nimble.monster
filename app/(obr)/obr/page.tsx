import { SSRSafe } from "@/components/shared/SSRSafe";
import OBRClientView from "./OBRClientView";

export default function OwlbearExtensionPage() {
  return (
    <SSRSafe>
      <OBRClientView />
    </SSRSafe>
  );
}
