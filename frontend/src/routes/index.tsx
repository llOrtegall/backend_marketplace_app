import { createBrowserRouter } from "react-router";
import { Suspense, lazy } from "react";

import Layout from "./Layout";
import AdminRouteGuard from "./AdminRouteGuard";
import CheckOut from "@/pages/CheckOut";

const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Admin = lazy(() => import("../pages/admin"));
const Orders = lazy(() => import("../pages/Orders"));


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
      },
      {
        path: "/checkout",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <CheckOut />
          </Suspense>
        )
      },
      {
        path: "/orders",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Orders />
          </Suspense>
        )
      }
    ]
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Login />
      </Suspense>
    )
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Register />
      </Suspense>
    )
  },
  {
    path: "/admin",
    element: (
      <AdminRouteGuard>
        <Suspense fallback={<div>Loading...</div>}>
          <Admin />
        </Suspense>
      </AdminRouteGuard>
    )
  }
])


