import { Suspense } from 'react';
import { SettingsHome } from "./components/SettingsHome";

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsHome />
    </Suspense>
  );
}
