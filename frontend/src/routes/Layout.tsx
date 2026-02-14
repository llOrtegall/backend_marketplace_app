import Header from "@/components/Header";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
}