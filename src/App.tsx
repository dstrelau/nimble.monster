import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

import Header from "./components/Header";

import { useContext } from "react";
import { AuthContext } from "./lib/auth";
import { User } from "./lib/types";
import BuildMonsterView from "./views/BuildMonsterView";
import EditMonsterView from "./views/EditMonsterView";
import HomeView from "./views/HomeView";
import MyCollectionsView from "./views/MyCollectionsView";
import MyMonstersView from "./views/MyMonstersView";
import ShowCollectionView from "./views/ShowCollectionView";
import { EditCollectionView } from "./views/EditCollectionView";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = useContext(AuthContext);

  if (currentUser.isLoading) {
    return <div>Loading...</div>;
  }

  if (currentUser.isSuccess && !currentUser.data) {
    window.location.href = "/auth/login";
    return null;
  }

  return <>{children}</>;
};

function Layout() {
  const currentUser = useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: () =>
      fetch("/api/users/me", { credentials: "same-origin" }).then((res) => {
        return res.json();
      }),
  });

  return (
    <AuthContext.Provider value={currentUser}>
      <Header />
      <main className="mx-auto flex-grow max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </AuthContext.Provider>
  );
}

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <HomeView />,
      },
      {
        path: "/my/monsters/new",
        element: <BuildMonsterView />,
      },
      {
        path: "/my/monsters",
        element: (
          <ProtectedRoute>
            <MyMonstersView />
          </ProtectedRoute>
        ),
      },
      {
        path: "/my/monsters/:id/edit",
        element: (
          <ProtectedRoute>
            <EditMonsterView />
          </ProtectedRoute>
        ),
      },
      {
        path: "/my/collections",
        element: (
          <ProtectedRoute>
            <MyCollectionsView />
          </ProtectedRoute>
        ),
      },
      {
        path: "/collections/:id",
        element: <ShowCollectionView />,
        loader: ({ params }) => ({
          id: params.id,
        }),
      },
      {
        path: "/my/collections/:id/edit",
        element: (
          <ProtectedRoute>
            <EditCollectionView />
          </ProtectedRoute>
        ),
        loader: ({ params }) => ({
          id: params.id,
        }),
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
