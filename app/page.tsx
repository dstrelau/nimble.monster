import { PlusCircle, Lock, ClipboardList, Check } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start gap-2">
        <div>
          <p className="text-lg">
            nimble.monster allows creating and organizing monsters for the{" "}
            <Link className="d-link" href="https://nimblerpg.com">
              Nimble TTRPG system
            </Link>
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
              <Link className="d-link" href="/monsters/new">
                Monster Builder
              </Link>{" "}
              to create a new Nimble-flavor monster, both standard and
              Legendary.
            </li>
            <li>
              Browse{" "}
              <Link className="d-link" href="/collections">
                public collections
              </Link>{" "}
              of community-created monsters.
            </li>
            <li>
              <s>Save a monster block as image.</s>{" "}
              <em>Temporarily removed. Back soon!</em>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex items-start gap-2">
        <Lock className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold">With Discord Login</h2>
          <ul className="mt-2 space-y-2 list-disc list-inside">
            <li>Save custom monster blocks for later reference.</li>
            <li>
              <Link className="d-link" href="/monsters">
                Publish monsters
              </Link>{" "}
              for the community or keep them private.
            </li>
            <li>
              Build your{" "}
              <Link className="d-link" href="/u/sanitywithin">
                public profile
              </Link>
            </li>
            <li>
              Group monsters into sharable{" "}
              <Link
                className="d-link"
                href="/collections//collections/ed25c4e5-4bd9-4f1e-8ad6-0850ed8d7d40"
              >
                collections.
              </Link>
            </li>
            <li>Create families of similar monsters that share traits.</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex items-start gap-2">
        <ClipboardList className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold">Coming Soon</h2>
          <ul className="mt-2 space-y-2 list-disc list-inside">
            <li>Upload Monster Images</li>
            <li className="items-center">
              <s>User profile pages</s>
              <Check className="inline w-4 h-4 ml-2 text-green-500" />
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex items-start gap-2">
        <p>
          If you have feedback or feature requests, reach out to me on Discord (
          <code>_byteslicer</code>) or raise an issue on the{" "}
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
        nimble.monster is an independent product published under the Nimble 3rd
        Party Creator License and is not affiliated with Nimble Co. Nimble ©
        2025 Nimble Co.
      </div>
    </div>
  );
}
