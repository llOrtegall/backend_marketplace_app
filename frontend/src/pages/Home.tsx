import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router";
import { toast } from "sonner";

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const authStatus = searchParams.get("auth");

    if (!authStatus) {
      return;
    }

    if (authStatus === "success") {
      toast.success("¡Bienvenido!", { id: "auth-feedback" });
    } else if (authStatus === "cancelled") {
      toast.error("Inicio con Google cancelado.", { id: "auth-feedback" });
    } else {
      toast.error("No se pudo completar la autenticación.", { id: "auth-feedback" });
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("auth");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <div>
      <h1>Home</h1>
      <Outlet />
    </div>
  );
}
