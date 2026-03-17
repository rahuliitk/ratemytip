import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MarketBar } from "@/components/market-context/market-bar";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <MarketBar />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <Footer />
      <WelcomeModal />
      <OnboardingTour />
    </div>
  );
}
