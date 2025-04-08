import { PlusCircle, Lock, ClipboardList } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div>
        <div className="flex items-start gap-2">
          <div>
            <p className="text-lg">
              nimble.monster allows creating and organizing monsters for the{" "}
              <a
                className="font-semibold text-indigo-600 hover:text-indigo-800 underline"
                href="https://nimblerpg.com"
              >
                Nimble TTRPG system
              </a>
              .
            </p>
            <p className="mt-2 text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
              This is a beta-quality product. It is entirely possible that data
              loss will occur. There are some bugs and usability issues.
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-2">
          <PlusCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold">Available Features</h2>
            <ul className="mt-2 space-y-2 list-disc list-inside">
              <li>
                Use the{" "}
                <a
                  className="text-indigo-600 hover:text-indigo-800 underline"
                  href="/monsters/new"
                >
                  Monster Builder
                </a>{" "}
                to create a new Nimble-flavor monster, both standard and
                Legendary.
              </li>
              <li>
                Browse{" "}
                <Link
                  className="text-indigo-600 hover:text-indigo-800 underline"
                  href="/collections"
                >
                  public collections
                </Link>{" "}
                of community-created monsters.
              </li>
              <li>
                Save a monster block as image. (WIP. It&lsquo;s a bit broken
                still.)
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-2">
          <Lock className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold">With Discord Login</h2>
            <ul className="mt-2 space-y-2 list-disc list-inside">
              {[
                "Save your monsters",
                "View your saved monsters",
                "Build collections of monsters that you can share",
                "Create families of similar monsters",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-2">
          <ClipboardList className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold">Coming Soon</h2>
            <ul className="mt-2 space-y-2 list-disc list-inside">
              {["Upload Monster Images", "User profile pages"].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-2">
          <p>
            If you have feedback or feature requests, reach out to me on Discord
            (<code>_byteslicer</code>) or raise an issue on the{" "}
            <a
              className="text-indigo-600 hover:text-indigo-800 underline"
              href="https://github.com/dstrelau/nimble.monster"
            >
              GitHub repository
            </a>
            .
          </p>
        </div>

        <div className="mt-16 text-sm text-gray-600 border-t pt-4">
          nimble.monster is an independent product published under the Nimble
          3rd Party Creator License and is not affiliated with Nimble Co. Nimble
          © 2025 Nimble Co.
        </div>
      </div>
    </div>
  );
}
