import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { RankedSystem } from "@/components/home/ranked-system";
import { DuelShowcase } from "@/components/home/duel-showcase";
import { LeaderboardPreview } from "@/components/home/leaderboard-preview";
import { FinalCta } from "@/components/home/final-cta";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <HowItWorks />
      <RankedSystem />
      <DuelShowcase />
      <LeaderboardPreview />
      <FinalCta />
    </div>
  );
}
