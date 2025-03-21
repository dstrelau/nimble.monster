import { Bars3Icon } from "@heroicons/react/24/outline";
import { FireIcon } from "@heroicons/react/24/solid";
import { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../lib/auth";

const NavItem = ({ href, title }: { href: string; title: string }) => {
  return (
    <li>
      <NavLink
        to={href}
        end
        className={({ isActive }) =>
          "rounded-md text-red px-3 py-2 text-sm font-medium " +
          (isActive
            ? "bg-gray-900 text-white"
            : "text-gray-300 hover:bg-gray-700 hover:text-white")
        }
      >
        {title}
      </NavLink>
    </li>
  );
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentUser = useContext(AuthContext);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest(".menu-control")
      ) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-neutral text-neutral-content shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex justify-between items-center h-16">
          <NavLink to="/" className="flex items-center">
            <FireIcon className="h-8" />
            <span className="hidden md:block ml-2 font-bold">
              nimble.monster
            </span>
          </NavLink>

          {/* Mobile menu button */}
          <div className="menu-control md:hidden">
            <button
              type="button"
              className="d-btn d-btn-ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Bars3Icon className="h-8" />
            </button>
          </div>

          {/* Desktop navigation */}
          <ul className="hidden md:flex space-x-4">
            <NavItem href="/my/monsters/new" title="Build Monster" />
            <NavItem href="/monsters" title="Monsters" />
            <NavItem href="/collections" title="Collections" />
          </ul>

          {/* Desktop user menu */}
          <div className="hidden md:block relative">
            {currentUser.data ? (
              <details className="d-dropdown">
                <summary className="d-btn d-btn-ghost p-0 rounded-md d-avatar">
                  <div className="w-10 rounded-md">
                    <img
                      src={`https://cdn.discordapp.com/avatars/${currentUser.data.discordId}/${currentUser.data.avatar}.png`}
                      alt={currentUser.data.username}
                    />
                  </div>
                </summary>
                <ul
                  className="d-menu d-dropdown-content bg-base-100 text-base text-base-content p-2 m-2 z-1 w-48 right-0 rounded-sm shadow-md"
                  role="menu"
                >
                  <li>
                    <NavLink
                      to="/my/monsters"
                      className="d-menu-item block"
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      My Monsters
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/my/collections"
                      className="d-menu-item block"
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      My Collections
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/my/families"
                      className="d-menu-item block"
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      My Families
                    </NavLink>
                  </li>
                  <li>
                    <form method="POST" action="/auth/logout">
                      <button
                        className="d-menu-item w-full text-left"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </form>
                  </li>
                </ul>
              </details>
            ) : (
              <a href="/auth/login">
                <img
                  className="size-8 rounded"
                  src="https://cdn.discordapp.com/embed/avatars/0.png"
                  alt="Login"
                />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Mobile expanded menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-neutral-800 p-4">
          <ul className="flex flex-col space-y-2">
            <NavItem href="/my/monsters/new" title="Build Monster" />
            <NavItem href="/monsters" title="Monsters" />
            <NavItem href="/collections" title="Collections" />

            {currentUser.data && (
              <>
                <NavItem href="/my/monsters" title="My Monsters" />
                <NavItem href="/my/collections" title="My Collections" />
                <NavItem href="/my/families" title="My Families" />
                <li className="text-center">
                  <form method="POST" action="/auth/logout">
                    <button
                      className="w-full rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </form>
                </li>
              </>
            )}

            {!currentUser.data && (
              <li className="text-center">
                <a
                  href="/auth/login"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Login
                </a>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Header;
