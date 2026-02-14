import { createBrowserRouter } from "react-router";
import { Suspense, lazy } from "react";

import Layout from "./Layout";

const Home = lazy(() => import("../pages/Home"));


export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Home />
          </Suspense>
        )
      }
    ]
  }
])


