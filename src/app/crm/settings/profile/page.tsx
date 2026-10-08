import { Suspense } from 'react';
import { ProfileView } from "../components/ProfileView";

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileView />
    </Suspense>
  );
}
