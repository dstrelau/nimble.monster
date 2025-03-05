import { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../lib/auth";

const NavItem = ({ href, title }: { href: string; title: string }) => {
  return (
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
  );
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentUser = useContext(AuthContext);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest(".user-menu")
      ) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-0">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <NavLink to="/" className="flex items-center mr-8">
              <svg
                className="size-10"
                viewBox="0 0 100 100"
                width="32"
                height="32"
              >
                <g
                  fill="currentColor"
                  className="text-indigo-600"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M25 45 L35 25 L45 45" />
                  <path d="M55 45 L65 25 L75 45" />

                  <path d="M30 40 C30 30, 70 30, 70 40 C70 60, 50 80, 50 80 C50 80, 30 60, 30 40" />

                  <path d="M35 45 C38 42, 42 42, 45 45 C42 48, 38 48, 35 45" />
                  <path d="M55 45 C58 42, 62 42, 65 45 C62 48, 58 48, 55 45" />
                  <path d="M48 50 L50 55 L52 50" />
                  <path d="M40 60 C45 65, 55 65, 60 60" />
                  <path d="M43 60 L43 63" />
                  <path d="M57 60 L57 63" />
                </g>
              </svg>
              <span className="ml-2 text-white font-bold">nimble.monster</span>
            </NavLink>
            <NavItem href="/my/monsters/new" title="Build Monster" />
            <NavItem href="/monsters" title="Monsters" />
            <NavItem href="/collections" title="Collections" />
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="user-menu relative ml-3">
                <div>
                  {currentUser.data ? (
                    <button
                      type="button"
                      className="relative rounded bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                      <img
                        className="size-8 rounded"
                        src={`https://cdn.discordapp.com/avatars/${currentUser.data.discordId}/${currentUser.data.avatar}.png`}
                        alt={currentUser.data.username}
                      />
                    </button>
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

                {isMenuOpen && (
                  <div
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex={-1}
                  >
                    <NavLink
                      to="/my/monsters"
                      className="block px-4 py-2 text-sm text-gray-700"
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Monsters
                    </NavLink>
                    <NavLink
                      to="/my/collections"
                      className="block px-4 py-2 text-sm text-gray-700"
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Collections
                    </NavLink>
                    <form method="POST" action="/auth/logout">
                      <button
                        className="block px-4 py-2 text-sm text-gray-700"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
