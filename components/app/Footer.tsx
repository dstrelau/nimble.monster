import {
  Beer,
  Coins,
  History,
  Mail,
  NotebookPen,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { SITE_EMAIL, SITE_NAME } from "@/lib/utils/branding";
import { Nexus } from "../icons/Nexus";
import { D20 } from "../icons/PolyhedralDice";
import { Discord, GitHub } from "../icons/SimpleIcons";

export const Footer = () => {
  const email = SITE_EMAIL;

  const sections = [
    {
      name: "About",
      links: [
        {
          icon: <ScrollText className="size-4" />,
          url: "/terms",
          text: "Terms",
        },
        {
          icon: <NotebookPen className="size-4" />,
          url: "/terms/attribution",
          text: "Attribution",
        },
        {
          icon: <History className="size-4" />,
          url: "/changelog",
          text: "Changelog",
        },
      ],
    },
    {
      name: "Support",
      links: [
        {
          icon: <GitHub />,
          url: "https://github.com/dstrelau/nimble.monster",
          text: "GitHub Repository",
        },
        {
          icon: <Mail className="size-4" />,
          url: `mailto:${email}`,
          text: email,
        },
      ],
    },
    {
      name: "More Nimble",
      links: [
        {
          icon: <D20 className="size-4" />,
          url: "https://nimblerpg.com",
          text: "Nimble Official",
        },
        {
          icon: <Discord />,
          url: "https://discord.gg/2etKN3aGfM",
          text: "Nimble Discord",
        },
        {
          icon: <Beer className="size-4" />,
          url: "https://nimbrew.net",
          text: "Nimbrew",
        },
      ],
    },
  ];
  return (
    <footer>
      <div className="mx-auto max-w-7xl flex flex-wrap-reverse justify-center gap-8 px-4 py-6 mt-16 border-t">
        <div className="max-w-2xl prose prose-neutral dark:prose-invert text-sm text-muted-foreground ">
          <p>
            <Nexus className="size-3 mr-0.5 inline align-baseline stroke-flame" />
            {SITE_NAME} is an independent product published under the Nimble 3rd
            Party Creator License and is not affiliated with Nimble Co.
          </p>
          <p>
            Want to support development?{" "}
            <Coins className="size-4 inline stroke-flame" />{" "}
            <Link href="https://ko-fi.com/byteslicer">Toss a coin</Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-8">
          {sections.map((section) => (
            <div className="min-w-28" key={section.name}>
              <h4 className="font-bold text-md">{section.name}</h4>
              <ul className="list-none pl-0 text-sm">
                {section.links.map((link) => (
                  <li key={link.url} className="flex items-center gap-2 py-1">
                    {link.icon}
                    <Link href={link.url}>{link.text}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};
