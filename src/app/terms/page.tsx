import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — CoinDuel",
};

const EFFECTIVE_DATE = "August 10, 2026";

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "1. Acceptance of these Terms",
    body: (
      <>
        <p>
          These Terms of Service (&quot;Terms&quot;) form a binding legal agreement between you
          (&quot;you&quot; or &quot;user&quot;) and CoinDuel (&quot;CoinDuel,&quot;
          &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and use of
          the CoinDuel website, application, and related services (collectively, the
          &quot;Service&quot;).
        </p>
        <p className="mt-3">
          By creating an account, verifying a wallet, or otherwise using the Service, you agree
          to be bound by these Terms and by our{" "}
          <Link href="/privacy" className="font-semibold text-accent hover:text-accent-dim">
            Privacy Policy
          </Link>
          , which is incorporated into these Terms by reference. If you do not agree, you must
          not use the Service.
        </p>
      </>
    ),
  },
  {
    heading: "2. Eligibility",
    body: (
      <>
        <p>To use CoinDuel, you must:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>be at least 18 years old, or the age of legal majority in your jurisdiction if higher;</li>
          <li>have the legal capacity to enter into a binding contract;</li>
          <li>
            not be located in, or a resident of, any country or region subject to comprehensive
            U.S. or other applicable trade sanctions, and not be listed on any government
            denied-party or sanctions list; and
          </li>
          <li>
            not be prohibited from using the Service under the laws of your jurisdiction,
            including any local restrictions on skill-based competitive gaming, cryptocurrency
            services, or wallet-linked applications.
          </li>
        </ul>
        <p className="mt-3">
          You are solely responsible for determining whether your use of the Service is legal in
          your jurisdiction. We may restrict access from certain regions at our discretion.
        </p>
      </>
    ),
  },
  {
    heading: "3. Account registration and security",
    body: (
      <>
        <p>
          You must register an account with accurate information to use the Service. You are
          responsible for maintaining the confidentiality of your login credentials and for all
          activity that occurs under your account. Notify us immediately of any unauthorized use.
        </p>
        <p className="mt-3">
          One person may not maintain more than one account. We may suspend or terminate
          duplicate, impersonating, or fraudulently created accounts without notice.
        </p>
      </>
    ),
  },
  {
    heading: "4. Description of the Service",
    body: (
      <>
        <p>
          CoinDuel is a competitive analytics game. It compares the real, publicly-visible trading
          performance (profit-and-loss, or &quot;PNL&quot;) of two verified Solana wallets over a
          fixed time window, and determines a match outcome based on that comparison.
        </p>
        <p className="mt-3">
          <span className="font-semibold text-foreground">CoinDuel is not a trading platform, exchange, broker-dealer, or wallet.</span>{" "}
          The Service does not custody user funds, does not execute, place, or facilitate any
          trade, and does not hold, transfer, or have the ability to move any digital asset on a
          user&apos;s behalf. No match, subscription, or other action on the Service results in
          an on-chain transaction initiated by CoinDuel. Any trading activity reflected in a
          user&apos;s PNL occurs entirely outside the Service, on third-party venues the user
          chooses independently.
        </p>
      </>
    ),
  },
  {
    heading: "5. Wallet verification",
    body: (
      <>
        <p>
          To participate in ranked play, you must verify ownership of a Solana wallet by signing
          a challenge message with that wallet&apos;s private key, using your own third-party
          wallet application (e.g., Phantom, Solflare). CoinDuel never requests, transmits, or
          stores a private key or seed phrase, and cannot access your wallet&apos;s funds.
        </p>
        <p className="mt-3">
          Each wallet address may be verified on only one CoinDuel account. Attempting to verify a
          wallet already claimed by another account will fail. You are responsible for the
          security of the wallet and device you use to verify and sign in to the Service.
        </p>
      </>
    ),
  },
  {
    heading: "6. Fair play and prohibited conduct",
    body: (
      <>
        <p>You agree not to, and not to assist any third party to:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            create, control, or verify a wallet on more than one account, or coordinate with
            another user to manipulate matchmaking, MMR, or match outcomes;
          </li>
          <li>
            use a bot, script, automated process, or any tool to interact with the Service, or to
            fabricate, spoof, or misrepresent wallet or trading data;
          </li>
          <li>
            exploit a bug, error, or unintended behavior of the Service instead of reporting it;
          </li>
          <li>
            interfere with, disrupt, or place an undue burden on the Service or its underlying
            infrastructure, including by circumventing rate limits or access controls;
          </li>
          <li>
            reverse engineer, decompile, or attempt to extract the source code of the Service,
            except where applicable law expressly permits it;
          </li>
          <li>
            harass, threaten, defame, or abuse another user, including through the Service&apos;s
            live video or audio features;
          </li>
          <li>
            upload a profile picture or other content that is unlawful, infringing, obscene, or
            impersonates another person or entity; or
          </li>
          <li>use the Service for any unlawful purpose or in violation of any applicable law.</li>
        </ul>
        <p className="mt-3">
          We may investigate suspected violations and take action including, without limitation,
          voiding match results, resetting MMR, and suspending or terminating an account, with or
          without prior notice.
        </p>
      </>
    ),
  },
  {
    heading: "7. Live video and audio",
    body: (
      <>
        <p>
          Ranked and private matches may include real-time, peer-to-peer video and audio between
          opponents, using your device&apos;s camera and microphone with your explicit browser
          permission. This media is transmitted directly between participants&apos; devices and
          is not recorded, stored, or viewed by CoinDuel. You may disable your camera or
          microphone at any time from the in-match controls, and granting camera/microphone
          access is never required to complete a match.
        </p>
        <p className="mt-3">
          You are solely responsible for your own conduct and what is visible or audible in your
          video feed during a match, and agree not to record, capture, or redistribute another
          user&apos;s video or audio without their consent.
        </p>
      </>
    ),
  },
  {
    heading: "8. Ranked play, matchmaking, and MMR",
    body: (
      <>
        <p>
          Match outcomes, matchmaking rating (&quot;MMR&quot;) changes, and PNL comparisons are
          calculated and recorded server-side, based on data obtained from third-party blockchain
          data providers. No user or client application can alter a recorded result.
        </p>
        <p className="mt-3">
          Matchmaking may, when no real opponent is available within a short waiting period, pair
          you against a system-controlled opponent whose performance is drawn from real,
          currently-indexed wallet activity rather than a live human. This is done solely to keep
          the queue playable and does not affect how your own match outcome, PNL, or MMR is
          calculated.
        </p>
        <p className="mt-3">
          We do not guarantee the availability of any specific matchmaking outcome, opponent, MMR
          tier, or leaderboard placement, and we may adjust matchmaking, MMR calculation, or
          ranked-play rules at any time to preserve competitive integrity.
        </p>
      </>
    ),
  },
  {
    heading: "9. No cash prizes; not gambling",
    body: (
      <>
        <p>
          CoinDuel does not award cash, cryptocurrency, or any prize of monetary value for winning
          a match, climbing the leaderboard, or achieving any rank or tier. Match outcomes affect
          only in-Service standing (MMR, rank tier, and leaderboard position). No wager, stake, or
          entry fee tied to a match outcome is collected by CoinDuel. Nothing in the Service
          constitutes a bet, wager, or game of chance for money or its equivalent.
        </p>
      </>
    ),
  },
  {
    heading: "10. CoinDuel Pro subscription and billing",
    body: (
      <>
        <p>
          CoinDuel Pro is an optional paid subscription that unlocks private duels, tournaments, a
          custom profile picture, and a Pro badge. It provides no competitive advantage in
          matchmaking, MMR, or match outcomes.
        </p>
        <p className="mt-3">
          Subscriptions are billed in advance on a recurring monthly basis through our
          payment processor, Stripe, and automatically renew until cancelled. By subscribing, you
          authorize us (via Stripe) to charge your chosen payment method each billing period. You
          can cancel at any time through the billing portal; your Pro access continues until the
          end of the then-current billing period, after which it will not renew.
        </p>
        <p className="mt-3">
          Except where required by law, payments are non-refundable, including for partial billing
          periods. Prices may change on notice; continued use after a price change constitutes
          acceptance of the new price for subsequent billing periods. We are not responsible for
          any fee, delay, or failure caused by Stripe or your card issuer.
        </p>
      </>
    ),
  },
  {
    heading: "11. Risk disclosure",
    body: (
      <>
        <p>
          CoinDuel displays trading performance data (including PNL) sourced from third-party
          blockchain data providers. Cryptocurrency markets are highly volatile, and on-chain data
          can be delayed, incomplete, or, in rare cases, inaccurate due to indexing latency,
          provider outages, or blockchain reorganizations. We do our best to source accurate data
          but do not guarantee its completeness or real-time accuracy, and match outcomes are
          based on the data available to the Service at the time of calculation.
        </p>
        <p className="mt-3">
          Nothing on the Service is, or should be construed as, investment, financial, tax, or
          legal advice, or a recommendation or solicitation to buy, sell, or hold any digital
          asset. Any trading decisions you make are made independently and at your own risk, on
          venues entirely outside CoinDuel&apos;s control.
        </p>
      </>
    ),
  },
  {
    heading: "12. Intellectual property",
    body: (
      <>
        <p>
          The Service, including its software, design, text, graphics, logos, and the CoinDuel
          name and marks, is owned by CoinDuel or its licensors and is protected by intellectual
          property laws. We grant you a limited, non-exclusive, non-transferable, revocable
          license to access and use the Service for your personal, non-commercial use, subject to
          these Terms. All rights not expressly granted are reserved.
        </p>
      </>
    ),
  },
  {
    heading: "13. User content",
    body: (
      <>
        <p>
          You retain ownership of content you upload to the Service, such as a profile picture.
          By uploading content, you grant CoinDuel a worldwide, royalty-free license to host,
          store, display, and reproduce that content solely as necessary to operate and display
          the Service (for example, showing your profile picture to opponents and on the
          leaderboard). You represent that you own or have the necessary rights to any content you
          upload, and that it does not infringe or violate the rights of any third party.
        </p>
        <p className="mt-3">
          We may remove content or terminate access for content that violates these Terms without
          prior notice.
        </p>
      </>
    ),
  },
  {
    heading: "14. Third-party services",
    body: (
      <>
        <p>
          The Service relies on and links to third-party services, including Solana wallet
          providers (e.g., Phantom, Solflare), blockchain data providers, Stripe for payments, and
          infrastructure providers for hosting, database, and file storage. Your use of those
          third-party services is governed by their own terms and privacy policies, which we
          encourage you to review. CoinDuel is not responsible for the acts, omissions, content,
          or availability of any third-party service.
        </p>
      </>
    ),
  },
  {
    heading: "15. Termination",
    body: (
      <>
        <p>
          You may stop using the Service and request deletion of your account at any time. We may
          suspend or terminate your access to the Service, in whole or in part, at any time, with
          or without notice, including for a violation of Section 6 (Fair play and prohibited
          conduct), suspected fraud, legal or regulatory reasons, or discontinuation of the
          Service.
        </p>
        <p className="mt-3">
          Upon termination, your right to use the Service ends immediately. Sections of these
          Terms that by their nature should survive termination (including Sections 9, 11–12, and
          16–21) will survive.
        </p>
      </>
    ),
  },
  {
    heading: "16. Disclaimer of warranties",
    body: (
      <>
        <p className="uppercase tracking-wide">
          The service is provided &quot;as is&quot; and &quot;as available,&quot; without
          warranties of any kind, whether express, implied, or statutory, including implied
          warranties of merchantability, fitness for a particular purpose, title, and
          non-infringement.
        </p>
        <p className="mt-3">
          We do not warrant that the Service will be uninterrupted, secure, or error-free, that
          any data (including PNL, MMR, or matchmaking data) will be accurate or complete, or that
          any defect will be corrected. Some jurisdictions do not allow the exclusion of certain
          warranties, so some of the above exclusions may not apply to you.
        </p>
      </>
    ),
  },
  {
    heading: "17. Limitation of liability",
    body: (
      <>
        <p className="uppercase tracking-wide">
          To the maximum extent permitted by law, CoinDuel and its officers, employees, and
          service providers will not be liable for any indirect, incidental, special,
          consequential, exemplary, or punitive damages, or any loss of profits, revenue, data, or
          goodwill, arising out of or related to your use of the Service, even if advised of the
          possibility of such damages.
        </p>
        <p className="mt-3">
          To the maximum extent permitted by law, our total aggregate liability arising out of or
          related to these Terms or the Service will not exceed the greater of (a) the amount you
          paid to CoinDuel in the twelve months preceding the claim, or (b) one hundred U.S.
          dollars ($100). Some jurisdictions do not allow certain limitations of liability, so some
          of the above limitations may not apply to you.
        </p>
      </>
    ),
  },
  {
    heading: "18. Indemnification",
    body: (
      <>
        <p>
          You agree to indemnify, defend, and hold harmless CoinDuel and its officers, employees,
          and service providers from any claim, liability, damage, loss, or expense (including
          reasonable attorneys&apos; fees) arising out of or related to your use of the Service,
          your violation of these Terms, or your violation of any right of a third party.
        </p>
      </>
    ),
  },
  {
    heading: "19. Dispute resolution and governing law",
    body: (
      <>
        <p>
          These Terms are governed by the laws of{" "}
          <span className="font-semibold text-foreground">[Governing Jurisdiction — to be confirmed by counsel]</span>
          , without regard to conflict-of-law principles. Any dispute arising out of or relating
          to these Terms or the Service will be resolved exclusively in the courts located in{" "}
          <span className="font-semibold text-foreground">[Venue — to be confirmed by counsel]</span>
          , and you consent to the personal jurisdiction of those courts.
        </p>
        <p className="mt-3 italic">
          [Placeholder: counsel should confirm whether binding arbitration and/or a class-action
          waiver should apply here instead, and confirm the correct governing law and venue for
          CoinDuel&apos;s operating entity and target markets.]
        </p>
      </>
    ),
  },
  {
    heading: "20. Changes to these Terms",
    body: (
      <>
        <p>
          We may modify these Terms from time to time. If we make material changes, we will
          update the effective date below and, where appropriate, provide additional notice (such
          as an in-app notice). Continued use of the Service after changes take effect constitutes
          acceptance of the revised Terms.
        </p>
      </>
    ),
  },
  {
    heading: "21. General provisions",
    body: (
      <>
        <p>
          <span className="font-semibold text-foreground">Entire agreement.</span> These Terms and
          the Privacy Policy constitute the entire agreement between you and CoinDuel regarding
          the Service, superseding any prior agreements.
        </p>
        <p className="mt-3">
          <span className="font-semibold text-foreground">Severability.</span> If any provision of
          these Terms is held unenforceable, the remaining provisions will remain in full force
          and effect.
        </p>
        <p className="mt-3">
          <span className="font-semibold text-foreground">No waiver.</span> Our failure to enforce
          any right or provision of these Terms will not be considered a waiver of that right or
          provision.
        </p>
        <p className="mt-3">
          <span className="font-semibold text-foreground">Assignment.</span> You may not assign or
          transfer these Terms without our prior written consent. We may assign these Terms
          without restriction, including in connection with a merger, acquisition, or sale of
          assets.
        </p>
        <p className="mt-3">
          <span className="font-semibold text-foreground">Force majeure.</span> We are not liable
          for any delay or failure to perform resulting from causes outside our reasonable
          control, including blockchain network outages, third-party data provider outages, or
          infrastructure failures.
        </p>
      </>
    ),
  },
  {
    heading: "22. Contact",
    body: (
      <p>
        Questions about these Terms can be sent to{" "}
        <span className="font-semibold text-foreground">[Contact email — to be added]</span>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col px-6 py-24">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">LEGAL</span>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
        Terms of Service
      </h1>
      <p className="mt-4 text-xs font-semibold tracking-wide text-muted">
        Effective date: {EFFECTIVE_DATE}
      </p>
      <div className="mt-8 flex flex-col gap-7">
        {SECTIONS.map((section) => (
          <div key={section.heading}>
            <h2 className="text-sm font-bold text-foreground">{section.heading}</h2>
            <div className="mt-1.5 text-sm leading-6 text-muted">{section.body}</div>
          </div>
        ))}
      </div>
      <Link
        href="/"
        className="mt-10 inline-block text-sm font-semibold text-accent transition-colors duration-150 hover:text-accent-dim"
      >
        &larr; Back to home
      </Link>
    </div>
  );
}
