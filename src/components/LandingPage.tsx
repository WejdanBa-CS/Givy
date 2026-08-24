import Link from "next/link";
import { LandingAccountLink, LandingCta } from "@/components/LandingActions";
import { LandingProductPreview } from "@/components/LandingProductPreview";
import { LogoMark } from "@/components/Logo";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";

const occasions = [
  { title: "Birthdays", body: "One link for the whole group." },
  { title: "Weddings", body: "A registry without the double gifts." },
  { title: "Baby showers", body: "Let people claim what you’ll actually use." },
  { title: "Graduations", body: "Share a list instead of a hint." },
  { title: "Holidays", body: "Family shopping without the group-chat chaos." },
  { title: "Group gifts", body: "See what’s taken before anyone spends." },
];

const steps = [
  {
    n: "01",
    title: "Create a list",
    body: "Add ideas with links and prices for birthdays, weddings, and more.",
    icon: <svg viewBox="0 0 32 32" aria-hidden className="h-[1.35rem] w-[1.35rem]"><rect x="6" y="5" width="20" height="22" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.75" /><path d="M11 12h10M11 17h10M11 22h6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>,
  },
  {
    n: "02",
    title: "Share one link",
    body: "Send it to friends and family. Anyone can open it.",
    icon: <svg viewBox="0 0 32 32" aria-hidden className="h-[1.35rem] w-[1.35rem]"><path d="M13.2 18.8a5.2 5.2 0 0 1 0-7.4l3.2-3.2a5.2 5.2 0 1 1 7.4 7.4l-1.6 1.6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /><path d="M18.8 13.2a5.2 5.2 0 0 1 0 7.4l-3.2 3.2a5.2 5.2 0 1 1-7.4-7.4l1.6-1.6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>,
  },
  {
    n: "03",
    title: "They claim in private",
    body: "You see what’s taken. You never see who bought it.",
    icon: <svg viewBox="0 0 32 32" aria-hidden className="h-[1.35rem] w-[1.35rem]"><rect x="8" y="14" width="16" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.75" /><path d="M12 14v-2.4a4 4 0 0 1 8 0V14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>,
  },
];

const kickerClass = "m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-leaf";
const sectionClass = "py-[clamp(3.5rem,8vw,5.5rem)] lg:py-[clamp(4.5rem,9vw,6.5rem)]";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-mist text-ink">
      <a className="skip-link" href="#preview">Skip to product preview</a>
      <header className="absolute inset-x-0 top-0 z-20 mx-auto flex w-[min(1120px,calc(100%-2rem))] items-center justify-between py-5 pt-[max(3.4rem,calc(env(safe-area-inset-top,0px)+2.5rem))] text-[#fff7f0] lg:w-[min(1180px,calc(100%-3rem))] lg:py-6 lg:pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+1.6rem))]">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#fff7f0]" aria-label="Givy home">
          <LogoMark size={36} />
          <span className="font-display text-xl font-semibold tracking-tight">Givy</span>
        </Link>
        <LandingAccountLink />
      </header>

      <main id="main">
        <section className="relative isolate grid min-h-svh items-end overflow-hidden" aria-labelledby="landing-headline">
          <div className="absolute inset-0 z-0">
            <picture className="absolute inset-0 block">
              <source srcSet="/givy-hero.avif" type="image/avif" />
              <source srcSet="/givy-hero.webp" type="image/webp" />
              <img src="/givy-hero.jpg" alt="A wrapped cream gift tied with a ribbon" width={1536} height={1024} decoding="async" fetchPriority="high" className="absolute inset-0 h-full w-full origin-center object-cover object-center motion-safe:animate-[hero-ken_20s_ease-in-out_1_forwards] sm:motion-safe:animate-[hero-ken_20s_ease-in-out_infinite_alternate] motion-reduce:animate-none lg:object-[center_28%]" />
            </picture>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,18,14,.58)_0%,rgba(26,18,14,.22)_32%,rgba(26,18,14,.58)_70%,rgba(26,18,14,.84)_100%)] lg:bg-[linear-gradient(105deg,rgba(26,18,14,.72)_0%,rgba(26,18,14,.42)_42%,rgba(26,18,14,.2)_68%,rgba(26,18,14,.35)_100%),linear-gradient(180deg,rgba(26,18,14,.28)_0%,rgba(26,18,14,.08)_38%,rgba(26,18,14,.45)_72%,rgba(26,18,14,.72)_100%)]" />
          </div>
          <div className="shell relative z-10 max-w-none pb-[max(2.75rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))] pt-[6.75rem] text-[#fff7f0] sm:pb-[clamp(3.5rem,10vh,6.5rem)] lg:pb-[clamp(4.5rem,12vh,8rem)] lg:pt-[8.5rem]">
            <FadeIn><p className="font-display text-[clamp(2.75rem,16vw,4.25rem)] font-semibold leading-[.92] tracking-[-.04em] sm:text-[clamp(3.5rem,12vw,7.5rem)] lg:text-[clamp(5.5rem,8vw,8.25rem)]">Givy</p></FadeIn>
            <FadeIn delay={0.12}><h1 id="landing-headline" className="mt-3 max-w-none text-[1.15rem] font-semibold leading-[1.35] tracking-[-.02em] text-[#fff7f0]/92 sm:mt-5 sm:max-w-[22rem] sm:text-[1.45rem] lg:mt-6 lg:max-w-[30rem] lg:text-[clamp(1.35rem,1.1vw+1rem,1.75rem)] lg:leading-[1.4]">One list. Zero awkward duplicates.</h1></FadeIn>
            <FadeIn delay={0.22}><p className="mt-2 max-w-none text-[.98rem] leading-[1.55] text-[#fff7f0]/92 sm:mt-3.5 sm:max-w-[34rem] sm:text-[1.05rem] lg:mt-4 lg:max-w-[38rem] lg:text-lg">Create one list, share one link, and let friends claim gifts privately — so nobody buys the same gift twice.</p></FadeIn>
            <FadeIn delay={0.32} className="mt-[1.15rem] flex flex-col items-stretch gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3 lg:mt-[2.15rem] lg:gap-3.5">
              <LandingCta compact className="min-h-12 w-full sm:min-w-[9.5rem] sm:w-auto lg:min-w-[11rem]" />
              <Button asChild size="lg" variant="secondary" className="min-h-12 w-full border-[#fff7f0]/55 bg-[#fff7f0]/18 text-[#fff7f0] backdrop-blur-[8px] hover:bg-[#fff7f0]/28 sm:w-auto lg:min-w-[11rem]"><a href="#preview">See a list</a></Button>
            </FadeIn>
          </div>
        </section>

        <section className="shell flex flex-wrap justify-center gap-x-6 gap-y-2.5 py-[1.15rem] text-center text-sm font-semibold text-ink-soft sm:text-[.92rem]" aria-label="Why Givy">
          {["No duplicate gifts", "Private claims", "Free to start"].map((item) => <span key={item} className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />{item}</span>)}
        </section>

        <LandingProductPreview />

        <section className="border-y border-line bg-paper py-[clamp(2.5rem,6vw,3.75rem)]"><FadeIn className="shell text-center"><h2 className="font-display text-3xl tracking-tight sm:text-4xl">Make yours in under a minute.</h2><p className="mx-auto mt-3 max-w-md text-ink-soft">Create a list, share the link, and let people claim in private.</p><LandingCta compact className="mx-auto mt-8 flex w-[min(20rem,100%)]" /></FadeIn></section>

        <section id="privacy" className={`${sectionClass} shell`} aria-labelledby="privacy-heading"><FadeIn><p className={kickerClass}>Private by design</p><h2 id="privacy-heading" className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">You see the gift. Never the giver.</h2><p className="mt-3 max-w-lg text-ink-soft lg:max-w-xl lg:text-lg">Anonymous claiming is the point. The owner and the guest get two different views of the same list.</p></FadeIn><Stagger className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-2 lg:gap-5" delay={0.08}><StaggerItem className="rounded-xl border-2 border-line bg-paper px-[1.35rem] py-[1.4rem] lg:px-[1.6rem] lg:py-7"><p className={kickerClass}>You see</p><h3 className="mt-2 font-display text-2xl">What’s taken</h3><p className="mt-2 text-ink-soft">Claimed gifts are marked Taken so you know what still needs covering. The name behind each claim stays hidden.</p></StaggerItem><StaggerItem className="rounded-xl border-2 border-line bg-paper px-[1.35rem] py-[1.4rem] lg:px-[1.6rem] lg:py-7"><p className={kickerClass}>Guests see</p><h3 className="mt-2 font-display text-2xl">What’s still open</h3><p className="mt-2 text-ink-soft">Friends pick an open gift and claim it privately. Other guests see Taken. Nobody else sees that it was them.</p></StaggerItem></Stagger></section>

        <section id="occasions" className={`${sectionClass} border-y border-line bg-paper`} aria-labelledby="occasions-heading"><div className="shell"><FadeIn><p className={kickerClass}>When to use it</p><h2 id="occasions-heading" className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">For every kind of gift moment.</h2><p className="mt-3 max-w-lg text-ink-soft lg:max-w-xl lg:text-lg">One private list works for celebrations, family holidays, and group presents.</p></FadeIn><Stagger className="mt-8 grid grid-cols-2 gap-3 max-[380px]:grid-cols-1 lg:mt-10 lg:grid-cols-3 lg:gap-4" delay={0.06}>{occasions.map((occasion) => <StaggerItem key={occasion.title} className="rounded-xl border-2 border-line bg-mist px-[.95rem] py-[.95rem] sm:px-[1.15rem] sm:py-[1.1rem] lg:px-[1.3rem] lg:py-[1.35rem]"><h3 className="font-display text-xl">{occasion.title}</h3><p className="mt-1 text-sm text-ink-soft">{occasion.body}</p></StaggerItem>)}</Stagger></div></section>

        <section id="how" className={`${sectionClass} shell`}><FadeIn><p className={kickerClass}>How it works</p><h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">Three quiet steps.</h2><p className="mt-3 max-w-lg text-ink-soft lg:max-w-xl lg:text-lg">From empty list to shared gifts without the awkward duplicates.</p></FadeIn><Stagger className="mt-11 grid border-t border-line lg:mt-[3.25rem] lg:grid-cols-3 lg:border-b" delay={0.1}>{steps.map((step, index) => <StaggerItem key={step.n} className={`grid grid-cols-[3rem_1fr] gap-3.5 border-b border-line py-7 sm:grid-cols-[4.5rem_1fr] sm:gap-5 lg:grid-cols-1 lg:gap-4 lg:border-b-0 lg:py-9 lg:pr-7 ${index < steps.length - 1 ? "lg:border-r" : "lg:pr-0"}`}><div className="grid justify-items-start gap-2"><span className="grid h-[2.625rem] w-[2.625rem] place-items-center rounded-[.85rem] bg-coral/8 text-coral">{step.icon}</span><span className="pt-[.2rem] font-display text-[1.35rem] font-semibold tracking-[-.02em] text-coral">{step.n}</span></div><div><h3 className="font-display text-2xl">{step.title}</h3><p className="mt-2 text-ink-soft">{step.body}</p></div></StaggerItem>)}</Stagger></section>

        <section className="bg-[radial-gradient(ellipse_80%_70%_at_50%_0%,rgba(255,205,60,.18),transparent_60%),var(--mist)] py-[clamp(3.5rem,8vw,5.5rem)] lg:py-[clamp(4.5rem,9vw,6.5rem)]"><FadeIn className="shell text-center"><h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">Ready when they are.</h2><p className="mx-auto mt-3 max-w-md text-ink-soft lg:max-w-lg lg:text-lg">Make a registry in under a minute.</p><LandingCta className="mx-auto mt-8 flex w-[min(20rem,100%)]" /></FadeIn></section>
      </main>

      <footer className="shell grid gap-1.5 border-t border-line py-7 pb-8 text-center text-sm text-ink-soft"><p>© {new Date().getFullYear()} Wejdan Al Amri · Givy · All rights reserved</p><nav className="flex flex-wrap justify-center gap-x-1" aria-label="Legal"><Link className="inline-flex min-h-11 items-center px-3 underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-coral" href="/privacy">Privacy</Link><Link className="inline-flex min-h-11 items-center px-3 underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-coral" href="/terms">Terms</Link><Link className="inline-flex min-h-11 items-center px-3 underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-coral" href="/delete-account">Delete account</Link></nav></footer>
    </div>
  );
}
