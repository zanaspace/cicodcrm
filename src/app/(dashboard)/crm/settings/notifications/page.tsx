import { Suspense } from 'react';
import { NotificationsView } from "../components/NotificationsView";

export default function NotificationsPage() {
  return (
    <Suspense>
      <NotificationsView />
    </Suspense>
  );
}
