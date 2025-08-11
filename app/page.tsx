import { ArrowRight, CornerRightDown } from "lucide-react";
import Image from "next/image";
import { Link } from "@/components/app/Link";
import { FamilyCard } from "@/components/FamilyCard";
import { Button } from "@/components/ui/button";
import { getRandomFeaturedFamily } from "@/lib/db/family";
import { monstersSortedByLevel } from "@/lib/utils";
import { Attribution } from "./ui/Attribution";
import { MonsterCardWithOverflow } from "./ui/MonsterCardWithOverflow";

export default async function HomePage() {
  const featuredFamily = await getRandomFeaturedFamily();
  // we want the middle card to be roughly vertical, so do some math
  const randomIdx = Math.floor(
    Math.random() * (featuredFamily?.monsters ?? []).length
  );
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
      <h1 className="text-6xl text-center font-bold">
        Create and share adversaries for <br />
        <span className="pr-3 font-slab font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-indigo-600">
          Nimble TTRPG
        </span>
      </h1>
      {!!featuredFamily?.monsters && (
        <>
          <h2 className="flex text-4xl text-center italic text-muted-foreground gap-2">
            <span>Like these</span>
            <span className="font-medium">{featuredFamily.name}</span>
            {featuredFamily.creator && (
              <>
                <span>by</span>
                <Attribution
                  user={featuredFamily.creator}
                  size="4xl"
                  className="not-italic"
                />
              </>
            )}
            <CornerRightDown className="mt-4 w-8 h-8" />
          </h2>

          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <FamilyCard family={featuredFamily} />
            </div>
            <div className="flex-1">
              <MonsterCardWithOverflow
                monster={
                  monstersSortedByLevel(featuredFamily.monsters)[randomIdx]
                }
              />
            </div>
          </div>
        </>
      )}

      <div className="dark:prose-invert">
        <div className="flex justify-center mb-8 gap-4">
          <Button className="px-4 py-6 bg-[#5865F2] hover:bg-[#5865F2] text-white font-semibold rounded-lg flex items-center gap-2 transition-colors">
            <Image
              src="https://cdn.discordapp.com/embed/avatars/0.png"
              alt="Discord"
              width="32"
              height="32"
              className="w-8 h-8"
            />
            Login with Discord
          </Button>
          <Button asChild className="px-4 py-6" variant="outline">
            <a href="/monsters">
              Browse Monsters
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
        </div>

        <div className="prose dark:prose-invert max-w-full mx-auto mt-16 text-sm text-muted-foreground border-t pt-4">
          <p>
            If you have feedback or feature requests, reach out to me on Discord{" "}
            (<i>_byteslicer</i>) or raise an issue on the{" "}
            <Link href="https://github.com/dstrelau/nimble.monster">
              GitHub repository
            </Link>
            .
          </p>
          <p>
            nimble.monster is an independent product published under the Nimble
            3rd Party Creator License and is not affiliated with Nimble Co.
            <br />
            Nimble © 2025 Nimble Co.
          </p>
        </div>
      </div>
    </div>
  );
}
