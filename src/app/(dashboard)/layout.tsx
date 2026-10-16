import { AppLayout } from "@/components/layout/AppLayout";

/** Every signed-in page: sidebar, header, session and page-access checks. proxy.ts already sent signed-out visitors to /login. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
