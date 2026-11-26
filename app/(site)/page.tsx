import { FaqSection } from "@/components/landing/faq-section"
import { Hero } from "@/components/landing/hero"
import { InboxSection } from "@/components/landing/inbox-section"
import { IndustriesSection } from "@/components/landing/industries-section"
import { JourneySection } from "@/components/landing/journey-section"
import { LandingRuntime } from "@/components/landing/landing-runtime"
import { ProductsSection } from "@/components/landing/products-section"
import { ReachSection } from "@/components/landing/reach-section"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteNav } from "@/components/landing/site-nav"
import { GuestVoiceAssistant } from "@/components/voice/guest-voice-assistant"

/*
  type: software (page-type software, site-kind software)
  deal: hero collage · palette: the client's own colours through start.mjs brand (ground #f6f7f9 and ink #282c34
        from the platform, teal #017b89 from the logo as the one accent; the logo's orange dot stays in the logo)
        · pairing instrument (Instrument Sans + DM Mono) · radius soft · nav-mega · footer-statement · close-word
        · rhythm space · buttons arrow · mark: the client's logo (BrandWordmark) in place of the dealt dots
        · lit ground sky · effect gradient-mesh in the hero frame · card ground painterly-landscape (#produk)
        · CSS grounds bg-band (#jangkauan), bg-mist (#faq)
  moments: counter-rolls in #jangkauan (the brief's figures roll once), pinned-chapters in #alur (the four steps
        of a session with Mbee, one frame). First deal line-carries-colour + liquid-type, dealt again: the transition
        had no new ground to carry under rhythm space.
  sections: hero (1) · #inbox app-frame (1) · #jangkauan split + counter (1) · #produk features-2x2 (2)
        · #alur pinned-chapters (2) · #industri tabs-tour (1) · #faq faq (1) · footer.closing (1)
*/
export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="top">
        <Hero />
        <InboxSection />
        <ReachSection />
        <ProductsSection />
        <JourneySection />
        <IndustriesSection />
        <FaqSection />
      </main>
      <SiteFooter />
      {/* widget Voice AI (launcher kanan bawah, panel, dialog bayar): dipasang sekali */}
      <div id="mbee-voice">
        <GuestVoiceAssistant />
      </div>
      <LandingRuntime />
    </>
  )
}
