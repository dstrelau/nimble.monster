import { Check, ClipboardList, PlusCircle } from "lucide-react";
import { Link } from "@/components/app/Link";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto prose prose-neutral dark:prose-invert">
      <h1 className="text-6xl text-center font-bold">
        Create and share adversaries for <br />
        <span className="pr-3 font-slab font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-indigo-600">
          Nimble TTRPG
        </span>
      </h1>

      <h2 className="flex items-center gap-2">
        <PlusCircle className="w-7 h-7 stroke-icon" />
        Features
      </h2>

      <ul>
        <li>
          Use the <Link href="/monsters/new">Monster Builder</Link> to create a
          new Nimble-flavor monster, both standard and Legendary.
        </li>
        <li>
          Browse <Link href="/collections">public collections</Link> of
          community-created monsters.
        </li>
        <li>Save a monster block as image.</li>
        <li>Save custom monster blocks for later reference.</li>
        <li>
          <Link href="/monsters">Publish monsters</Link> for the community or
          keep them private.
        </li>
        <li>
          Build your <Link href="/u/sanitywithin">public profile</Link>.
        </li>
        <li>
          Group monsters into sharable{" "}
          <Link href="/collections">collections.</Link>
        </li>
        <li>Create families of similar monsters that share traits.</li>
      </ul>

      <h2 className="flex items-center gap-2">
        <ClipboardList className="w-7 h-7 stroke-icon" />
        Coming Soon
      </h2>
      <ul>
        <li>Upload Monster Images</li>
        <li className="items-center">
          <s>User profile pages</s>
          <Check className="inline w-4 h-4 ml-2 text-success" />
        </li>
      </ul>

      <Card className="mt-8 flex items-start gap-2">
        <CardContent>
          If you have feedback or feature requests, reach out to me on Discord (
          <code>_byteslicer</code>) or raise an issue on the{" "}
          <a href="https://github.com/dstrelau/nimble.monster">
            GitHub repository
          </a>
          .
        </CardContent>
      </Card>

      <div className="mt-16 text-sm text-gray-600 border-t pt-4">
        nimble.monster is an independent product published under the Nimble 3rd
        Party Creator License and is not affiliated with Nimble Co. Nimble ©
        2025 Nimble Co.
      </div>
    </div>
  );
}
