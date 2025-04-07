"use client";

import { Bars3Icon } from "@heroicons/react/24/outline";
import { FireIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

const Header = () => {
  const { data: session } = useSession();
  const currentUser = session?.user;
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const closeMenu = () => {
    const detailsElement = document.querySelector(
      "#user-dropdown",
    ) as HTMLDetailsElement;
    if (detailsElement) {
      detailsElement.open = false;
    }
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest("#user-dropdown")
      ) {
        closeMenu();
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <nav className="d-navbar bg-neutral text-neutral-content shadow-sm">
      <div className="mx-auto max-w-7xl w-full px-4 flex justify-between items-center h-16">
        <Link href="/" className="flex items-center">
          <FireIcon className="h-8" />
          <span className="hidden md:block ml-2 font-bold">nimble.monster</span>
        </Link>

        {/* Desktop navigation */}
        <ul className="hidden md:flex d-menu d-menu-horizontal">
          <li>
            <Link
              href="/monsters/new"
              className={isActive("/monsters/new") ? "font-bold" : ""}
            >
              Build Monster
            </Link>
          </li>
          <li>
            <Link
              href="/monsters"
              className={isActive("/monsters") ? "font-bold" : ""}
            >
              All Monsters
            </Link>
          </li>
          <li>
            <Link
              href="/collections"
              className={isActive("/collections") ? "font-bold" : ""}
            >
              All Collections
            </Link>
          </li>
        </ul>

        {/* Dropdown menu */}
        <div>
          {currentUser ? (
            <details id="user-dropdown" className="d-dropdown d-dropdown-end">
              <summary className="list-none">
                <div className="hidden md:block d-btn d-btn-ghost p-0 rounded-md d-avatar">
                  <div className="w-10 rounded-md">
                    <Image
                      src={
                        currentUser.image ||
                        "https://cdn.discordapp.com/embed/avatars/0.png"
                      }
                      alt={currentUser.name ?? ""}
                      width={48}
                      height={48}
                    />
                  </div>
                </div>
                <div className="d-btn d-btn-ghost md:hidden">
                  <Bars3Icon className="h-8" />
                </div>
              </summary>

              <ul
                className="d-menu d-dropdown-content bg-base-100 text-base text-base-content p-2 m-2 z-1 w-64 md:w-48 rounded-sm shadow-md"
                role="menu"
              >
                <li className="md:hidden">
                  <Link
                    href="/monsters/new"
                    className={isActive("/monsters/new") ? "font-bold" : ""}
                  >
                    Build Monster
                  </Link>
                </li>
                <li className="md:hidden">
                  <Link
                    href="/monsters"
                    className={isActive("/monsters") ? "font-bold" : ""}
                  >
                    All Monsters
                  </Link>
                </li>
                <li className="md:hidden">
                  <Link
                    href="/collections"
                    className={isActive("/collections") ? "font-bold" : ""}
                  >
                    All Collections
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my/monsters"
                    className={isActive("/my/monsters") ? "font-bold" : ""}
                  >
                    My Monsters
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my/collections"
                    className={isActive("/my/collections") ? "font-bold" : ""}
                  >
                    My Collections
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my/families"
                    className={isActive("/my/families") ? "font-bold" : ""}
                  >
                    My Families
                  </Link>
                </li>
                <li>
                  <button
                    className="d-menu-item"
                    onClick={() => signOut({ redirectTo: "/" })}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </details>
          ) : (
            <button
              className="cursor-pointer"
              onClick={() => signIn("discord", { redirectTo: "/my/monsters" })}
            >
              <Image
                className="size-8 rounded"
                src="https://cdn.discordapp.com/embed/avatars/0.png"
                alt="Login"
                width={32}
                height={32}
              />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
