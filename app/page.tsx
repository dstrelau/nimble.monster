import { ArrowRight, CornerRightDown } from "lucide-react";
import { DiscordLoginButton } from "@/components/app/DiscordLoginButton";
import { FamilyCard } from "@/components/FamilyCard";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getRandomFeaturedFamily } from "@/lib/db/family";
import { getRandomRecentItems } from "@/lib/db/item";
import { Attribution } from "./ui/Attribution";
import { Card as ItemCard } from "./ui/item/Card";
import { MonsterCardWithOverflow } from "./ui/MonsterCardWithOverflow";

export default async function HomePage() {
  const session = await auth();
  const featuredFamily = await getRandomFeaturedFamily();
  const recentItems = await getRandomRecentItems(3);
  // we want the middle card to be roughly vertical, so do some math
  const randomIdx = Math.floor(
    Math.random() * (featuredFamily?.monsters ?? []).length
  );
  return (
    <div>
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
        <h1 className="text-4xl md:text-6xl text-center font-semibold grade-100">
          Your homebrew hub for <br />
          <span className="pr-3 font-slab font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-indigo-600">
            Nimble TTRPG
          </span>
        </h1>
        {!!featuredFamily?.monsters && (
          <>
            <h2 className="flex flex-wrap gap-2 text-2xl md:text-4xl items-center justify-center text-center italic text-muted-foreground md:max-w-[39rem] mx-auto">
              <span>Explore hundreds of creative monsters like these</span>
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
              <CornerRightDown className="w-8 h-8" />
            </h2>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1">
                <FamilyCard
                  family={featuredFamily}
                  monsters={featuredFamily.monsters}
                />
              </div>
              <div className="flex-1">
                <MonsterCardWithOverflow
                  monster={featuredFamily.monsters[randomIdx]}
                />
              </div>
            </div>
          </>
        )}

        <div className="dark:prose-invert">
          <div className="flex justify-center mb-8 gap-4">
            {!session?.user && <DiscordLoginButton />}
            <Button asChild className="px-4 py-6" variant="outline">
              <a href="/monsters">
                Browse Monsters
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        {recentItems.length > 0 && (
          <>
            <h2 className="flex flex-wrap gap-2 text-2xl md:text-4xl text-center italic text-muted-foreground">
              Or you might like these recent items
              <CornerRightDown className="mt-4 w-8 h-8" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              {recentItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  creator={item.creator}
                  hideActions={true}
                />
              ))}
            </div>
          </>
        )}
        <div className="dark:prose-invert">
          <div className="flex justify-center mb-8 gap-4">
            <Button asChild className="px-4 py-6" variant="outline">
              <a href="/items">
                Browse Items
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
