import { Beer, Coins, Flame, Mail, ScrollText } from "lucide-react";
import Link from "next/link";
import { Discord, GitHub } from "../SimpleIcons";

export const Footer = () => {
  const sections = [
    {
      name: "About",
      links: [
        {
          icon: <ScrollText className="size-4" />,
          url: "/terms",
          text: "Terms",
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
          url: "mailto:hello@nimble.monster",
          text: "hello@nimble.monster",
        },
      ],
    },
    {
      name: "More Nimble",
      links: [
        {
          icon: (
            <svg
              className="size-4"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>D20</title>
              <path d="m12 2 4.81 7.4a2 2 0 0 1 .1.17L20.74 17h0l-8.5.97a2 2 0 0 1-.46 0L3.27 17h0l3.81-7.43a2 2 0 0 1 .1-.18L12 2h0Z" />
              <path d="M12.87 17.5a1 1 0 0 1-1.74 0l-4-7A1 1 0 0 1 8 9h8a1 1 0 0 1 .87 1.5l-4 7Z" />
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            </svg>
          ),
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
        <div className="max-w-2xl prose dark:prose-invert text-sm text-muted-foreground ">
          <p>
            <Flame className="size-3 mr-0.5 inline align-baseline stroke-flame" />
            nimble.monster is an independent product published under the Nimble
            3rd Party Creator License and is not affiliated with Nimble Co.
            Nimble © 2025 Nimble Co.
          </p>
          <Link href="https://discord.gg/2etKN3aGfM" />
          <p>
            Card icons from the amazing{" "}
            <Link href="https://github.com/game-icons/icons/blob/master/license.txt">
              Game Icons
            </Link>
            , used under the CC-BY 3.0 license.
          </p>
          <p>
            Want to support development?{" "}
            <Coins className="size-4 inline stroke-flame" />{" "}
            <Link href="https://ko-fi.com/byteslicer">Toss a coin</Link>
          </p>
        </div>
        <div className="flex gap-8">
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
