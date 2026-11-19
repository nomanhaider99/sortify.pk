import { BRAND } from "@repo/shared";
import type { Route } from "next";
import Link from "next/link";
import { FacebookIcon, InstagramIcon, PaymentBadge, XIcon } from "@/components/icons";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import type { ShellData } from "@/lib/data";
import { routes } from "@/lib/routes";
import { NewsletterForm } from "./newsletter-form";

const SOCIALS = [
  { label: "Instagram", href: BRAND.social.instagram, Icon: InstagramIcon },
  { label: "X", href: BRAND.social.x, Icon: XIcon },
  { label: "Facebook", href: BRAND.social.facebook, Icon: FacebookIcon },
] as const;

export function Footer({ data }: { data: ShellData }) {
  const columns: { heading: string; links: { label: string; href: Route }[] }[] = [
    {
      heading: "Shop",
      links: [
        { label: "Shop All", href: routes.shop },
        { label: "New Arrivals", href: routes.newArrivals },
        { label: "Best Sellers", href: routes.bestSellers },
        ...data.categories.map((c) => ({ label: c.name, href: routes.category(c.slug) })),
      ],
    },
    {
      heading: "Help",
      links: [
        { label: "About Us", href: routes.about },
        { label: "Contact", href: routes.contact },
        { label: "Track Order", href: routes.track },
        { label: "Shipping & Returns", href: routes.shipping },
        { label: "FAQ", href: routes.faq },
      ],
    },
  ];

  return (
    <footer className="bg-ink text-on-strong">
      <div className="container-site pt-20 pb-10 md:pt-28">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <Reveal>
            <h2 className="font-display text-display-md italic">Letters from the workshop</h2>
            <p className="text-on-strong/75 mt-3 max-w-sm text-sm">
              New collections, care guides and the occasional quiet sale. No noise, unsubscribe any
              time.
            </p>
            <div className="mt-8">
              <NewsletterForm />
            </div>
          </Reveal>

          {columns.map((col) => (
            <RevealGroup key={col.heading}>
              <RevealItem>
                <h3 className="text-on-strong/60 text-xs font-medium tracking-[0.14em] uppercase">
                  {col.heading}
                </h3>
              </RevealItem>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <RevealItem distance={12}>
                      <Link
                        href={l.href}
                        className="text-on-strong/85 hover:text-on-strong text-sm transition-colors"
                      >
                        {l.label}
                      </Link>
                    </RevealItem>
                  </li>
                ))}
              </ul>
            </RevealGroup>
          ))}

          <Reveal>
            <h3 className="text-on-strong/60 text-xs font-medium tracking-[0.14em] uppercase">
              Visit
            </h3>
            <address className="text-on-strong/85 mt-5 space-y-3 text-sm not-italic">
              <p>{data.store.address}</p>
              <p>{data.store.hours}</p>
              <p>
                <a
                  href={`mailto:${data.store.email}`}
                  className="hover:text-on-strong underline-offset-4 hover:underline"
                >
                  {data.store.email}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${data.store.phone.replace(/[^+\d]/g, "")}`}
                  className="hover:text-on-strong"
                >
                  {data.store.phone}
                </a>
              </p>
            </address>
          </Reveal>
        </div>

        <div className="border-on-strong/15 mt-20 flex flex-col gap-6 border-t pt-8 md:flex-row md:items-center md:justify-between">
          <ul className="flex gap-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${data.store.name} on ${label}`}
                  className="border-on-strong/30 hover:bg-on-strong hover:text-ink flex size-10 items-center justify-center rounded-full border transition-colors duration-300"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
            <li>
              <PaymentBadge label="Cash on delivery" />
            </li>
            <li>
              <PaymentBadge label="Visa" />
            </li>
            <li>
              <PaymentBadge label="Mastercard" />
            </li>
          </ul>
          <p className="text-on-strong/60 text-xs">
            © {new Date().getFullYear()} {data.store.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
