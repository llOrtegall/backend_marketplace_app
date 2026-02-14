import Header from "@/components/Header";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <>
      <p className="text-center font-medium uppercase text-sm py-1 px-4 bg-gray-200">
        Envíos gratis en compras superiores a $50.000 - Cali, Palmira, Yumbo, La Cumbre y Vijes - Envíos a todo el país con un costo adicional
      </p>
      <Header />
      <Outlet />
    </>
  );
}