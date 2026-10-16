import { Suspense } from "react";
import { ApiKeysView } from "../components/ApiKeysView";

export default function ApiKeysPage() {
  return (
    <Suspense>
      <ApiKeysView />
    </Suspense>
  );
}
