import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
