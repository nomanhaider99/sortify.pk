import { getSettings } from "@repo/db";
import { BRAND, DEFAULT_SETTINGS, formatMoney } from "@repo/shared";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { ContactForm } from "@/components/contact/contact-form";
import { FacebookIcon, InstagramIcon, XIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { Accordion } from "@/components/ui/accordion";
import { Container } from "@/components/ui/container";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about an order, a product or a trade enquiry? We’d love to hear from you.",
};

async function load() {
  try {
    return await getSettings(["store", "shipping"]);
  } catch {
    return { store: DEFAULT_SETTINGS.store, shipping: DEFAULT_SETTINGS.shipping };
  }
}

export default async function ContactPage() {
  const { store, shipping } = await load();
  const faqs = [
    {
      id: "shipping",
      title: "How much is shipping and how long does it take?",
      content: (
        <p>
          Standard delivery takes {shipping.standardEta} and costs{" "}
          {formatMoney(shipping.standardCents)} — it’s free on orders over{" "}
          {formatMoney(shipping.freeShippingThresholdCents)}. Express delivery takes{" "}
          {shipping.expressEta} for {formatMoney(shipping.expressCents)}. Every order is tracked;
          you’ll find live updates on our Track Order page.
        </p>
      ),
    },
    {
      id: "returns",
      title: "What is your returns policy?",
      content: (
        <p>
          Return any unused item in its original packaging within 30 days for a full refund. Contact
          us and we’ll arrange the return.
        </p>
      ),
    },
    {
      id: "cod",
      title: "Can I pay cash on delivery?",
      content: (
        <p>
          Yes — choose Cash on Delivery at checkout and pay the courier when your order arrives. We
          also accept all major cards.
        </p>
      ),
    },
    {
      id: "handmade",
      title: "Why does my piece look slightly different from the photo?",
      content: (
        <p>
          Many of our ceramics and wooden pieces are made by hand, so glazes, grain and knots vary a
          little from piece to piece. We think that’s part of their charm.
        </p>
      ),
    },
    {
      id: "trade",
      title: "Do you offer trade or bulk pricing?",
      content: (
        <p>
          We do — interior designers, cafés and hospitality projects can send us a message with
          “Trade” in the subject.
        </p>
      ),
    },
  ];

  return (
    <>
      <section className="relative isolate flex min-h-[46svh] items-end overflow-hidden">
        <Image
          src="/images/site/living-warm.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/65 via-black/35 to-black/20" />
        <Container className="text-on-strong pt-40 pb-14">
          <p className="text-on-strong/80 text-xs tracking-[0.16em] uppercase">Contact</p>
          <RevealText
            as="h1"
            immediate
            text="We’d love to hear from you"
            className="font-display text-display-xl mt-3 italic"
          />
        </Container>
      </section>

      <Container className="py-section grid gap-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-24">
        <Reveal>
          <p className="text-ink-muted leading-relaxed">
            Questions about an order, a product or a trade enquiry? Send us a note and a real person
            from the {BRAND.name} team will reply — usually within one business day.
          </p>
          <ul className="mt-10 space-y-7">
            <li className="flex gap-4">
              <MapPin
                className="text-primary-strong mt-0.5 size-5 shrink-0"
                strokeWidth={1.5}
                aria-hidden
              />
              <div>
                <p className="text-xs font-medium tracking-[0.12em] uppercase">Studio & showroom</p>
                <p className="text-ink-muted mt-1 text-sm">{store.address}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <Mail
                className="text-primary-strong mt-0.5 size-5 shrink-0"
                strokeWidth={1.5}
                aria-hidden
              />
              <div>
                <p className="text-xs font-medium tracking-[0.12em] uppercase">Email</p>
                <a
                  href={`mailto:${store.email}`}
                  className="text-ink-muted hover:text-ink mt-1 inline-flex min-h-6 items-center text-sm"
                >
                  {store.email}
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <Phone
                className="text-primary-strong mt-0.5 size-5 shrink-0"
                strokeWidth={1.5}
                aria-hidden
              />
              <div>
                <p className="text-xs font-medium tracking-[0.12em] uppercase">Phone</p>
                <a
                  href={`tel:${store.phone.replace(/[^+\d]/g, "")}`}
                  className="text-ink-muted hover:text-ink mt-1 inline-flex min-h-6 items-center text-sm"
                >
                  {store.phone}
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <Clock
                className="text-primary-strong mt-0.5 size-5 shrink-0"
                strokeWidth={1.5}
                aria-hidden
              />
              <div>
                <p className="text-xs font-medium tracking-[0.12em] uppercase">Opening hours</p>
                <p className="text-ink-muted mt-1 text-sm">{store.hours}</p>
              </div>
            </li>
          </ul>
          <div className="mt-10 flex gap-3">
            {[
              { label: "Instagram", href: BRAND.social.instagram, Icon: InstagramIcon },
              { label: "X", href: BRAND.social.x, Icon: XIcon },
              { label: "Facebook", href: BRAND.social.facebook, Icon: FacebookIcon },
            ].map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${store.name} on ${label}`}
                className="border-border hover:bg-ink hover:text-bg flex size-10 items-center justify-center rounded-full border transition-colors"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="font-display text-display-md italic">Send us a message</h2>
          <div className="mt-8">
            <ContactForm />
          </div>
        </Reveal>
      </Container>

      <section id="faq" className="bg-surface-muted py-section scroll-mt-24">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-24">
          <div>
            <p className="text-ink-muted text-xs tracking-[0.16em] uppercase">Help</p>
            <RevealText
              as="h2"
              text="Frequently asked questions"
              className="font-display text-display-lg mt-3 italic"
            />
          </div>
          <Accordion items={faqs} />
        </Container>
      </section>
    </>
  );
}
