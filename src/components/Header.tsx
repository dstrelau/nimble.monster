import { Bars3Icon } from "@heroicons/react/24/outline";
import { FireIcon } from "@heroicons/react/24/solid";
import { useContext, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../lib/auth";

const Header = () => {
  const currentUser = useContext(AuthContext);

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
        <NavLink to="/" className="flex items-center">
          <FireIcon className="h-8" />
          <span className="hidden md:block ml-2 font-bold">nimble.monster</span>
        </NavLink>

        {/* Desktop navigation */}
        <ul className="hidden md:flex d-menu d-menu-horizontal">
          <li>
            <NavLink to="/my/monsters/new"> Build Monster </NavLink>
          </li>
          <li>
            <NavLink to="/monsters"> All Monsters </NavLink>
          </li>
          <li>
            <NavLink to="/collections"> All Collections </NavLink>
          </li>
        </ul>

        {/* Dropdown menu */}
        <div>
          {currentUser.data ? (
            <details id="user-dropdown" className="d-dropdown d-dropdown-end">
              <summary className="list-none">
                <div className="hidden md:block d-btn d-btn-ghost p-0 rounded-md d-avatar">
                  <div className="w-10 rounded-md">
                    <img
                      src={`https://cdn.discordapp.com/avatars/${currentUser.data.discordId}/${currentUser.data.avatar}.png`}
                      alt={currentUser.data.username}
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
                  <NavLink to="/my/monsters/new">Build Monster</NavLink>
                </li>
                <li className="md:hidden">
                  <NavLink to="/my/monsters">All Monsters</NavLink>
                </li>
                <li className="md:hidden">
                  <NavLink to="/collections">All Collections</NavLink>
                </li>
                <li>
                  <NavLink to="/my/monsters">My Monsters</NavLink>
                </li>
                <li>
                  <NavLink to="/my/collections">My Collections</NavLink>
                </li>
                <li>
                  <NavLink to="/my/families">My Families</NavLink>
                </li>
                <li>
                  <form method="POST" action="/auth/logout">
                    <button className="d-menu-item">Logout</button>
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
    </nav>
  );
};

export default Header;
