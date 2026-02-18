import { Link, useNavigate } from "react-router";
import { z, treeifyError } from "zod";
import { useState } from "react";
import { toast } from "sonner";

import { signIn } from "@/lib/auth-client";
import { Eye, EyeClosed } from "lucide-react";

const loginSchema = z.object({
  email: z.email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const initialFormValues: LoginFormValues = {
  email: "",
  password: "",
};

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<LoginFormValues>(initialFormValues);

  const handleInputChange = (field: keyof LoginFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const preventClipboardAction = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
  };

  const preventClipboardShortcuts = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const key = event.key.toLowerCase();
    const usesCtrlOrMeta = event.ctrlKey || event.metaKey;

    const isBlockedShortcut =
      (usesCtrlOrMeta && ["c", "v", "x", "insert"].includes(key)) ||
      (event.shiftKey && ["insert", "delete"].includes(key));

    if (isBlockedShortcut) {
      event.preventDefault();
    }
  };

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedForm = loginSchema.safeParse(formValues);
    if (!parsedForm.success) {
      const errors = treeifyError(parsedForm.error);
      toast.error(errors.errors?.[0] ?? errors.errors?.[0] ?? "Datos inválidos");
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await signIn.email({
        email: parsedForm.data.email.trim().toLowerCase(),
        password: parsedForm.data.password,
        callbackURL: `${import.meta.env.VITE_AUTH_BASE_URL ?? "http://localhost:5173"}/?auth=success`,
      });

      if (result.error) {
        toast.error(result.error.message ?? "No se pudo iniciar sesión. Intenta nuevamente.");
        return;
      }

      navigate("/?auth=success");
    } catch {
      toast.error("Ocurrió un error inesperado. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-none">
        <h1 className="text-2xl font-bold text-center mb-6">Inicia sesión</h1>

        <button
          type="button"
          onClick={() => signIn.social({ provider: "google", callbackURL: "http://localhost:5173/?auth=success" })}
          className="w-full flex items-center justify-center space-x-2 border border-gray-300 rounded-md py-2 mb-6 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <figure className="flex items-center space-x-2 size-6">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M30.0014 16.3109C30.0014 15.1598 29.9061 14.3198 29.6998 13.4487H16.2871V18.6442H24.1601C24.0014 19.9354 23.1442 21.8798 21.2394 23.1864L21.2127 23.3604L25.4536 26.58L25.7474 26.6087C28.4458 24.1665 30.0014 20.5731 30.0014 16.3109Z" fill="#4285F4"></path> <path d="M16.2863 29.9998C20.1434 29.9998 23.3814 28.7553 25.7466 26.6086L21.2386 23.1863C20.0323 24.0108 18.4132 24.5863 16.2863 24.5863C12.5086 24.5863 9.30225 22.1441 8.15929 18.7686L7.99176 18.7825L3.58208 22.127L3.52441 22.2841C5.87359 26.8574 10.699 29.9998 16.2863 29.9998Z" fill="#34A853"></path> <path d="M8.15964 18.769C7.85806 17.8979 7.68352 16.9645 7.68352 16.0001C7.68352 15.0356 7.85806 14.1023 8.14377 13.2312L8.13578 13.0456L3.67083 9.64746L3.52475 9.71556C2.55654 11.6134 2.00098 13.7445 2.00098 16.0001C2.00098 18.2556 2.55654 20.3867 3.52475 22.2845L8.15964 18.769Z" fill="#FBBC05"></path> <path d="M16.2864 7.4133C18.9689 7.4133 20.7784 8.54885 21.8102 9.4978L25.8419 5.64C23.3658 3.38445 20.1435 2 16.2864 2C10.699 2 5.8736 5.1422 3.52441 9.71549L8.14345 13.2311C9.30229 9.85555 12.5086 7.4133 16.2864 7.4133Z" fill="#EB4335"></path> </g></svg>
          </figure>
          <span className="text-sm font-medium text-gray-800">Iniciar sesión con Google</span>
        </button>

        <div className="flex items-center justify-center space-x-2 mb-6">
          <span className="border-t border-gray-300 grow"></span>
          <span className="text-sm text-gray-500">o</span>
          <span className="border-t border-gray-300 grow"></span>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="Ingresar correo electrónico"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              autoComplete="email"
              value={formValues.email}
              onChange={handleInputChange("email")}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Contraseña</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresar contraseña"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black pr-10"
                autoComplete="current-password"
                value={formValues.password}
                onChange={handleInputChange("password")}
                onCopy={preventClipboardAction}
                onCut={preventClipboardAction}
                onPaste={preventClipboardAction}
                onKeyDown={preventClipboardShortcuts}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeClosed className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs underline font-medium text-black">¿Olvidaste tu contraseña?</Link>
          </div>
          <button
            type="submit"
            className="w-full cursor-pointer bg-black text-white font-semibold py-2 rounded-md mt-2 hover:bg-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
        <div className="my-8 border-t border-gray-200"></div>
        <div className="flex items-center justify-center space-x-2 text-center text-sm">
          <span className="font-medium">¿Aún no tienes una cuenta?</span>
          <span>&rarr;</span>
          <Link to="/register" className="underline font-medium text-gray-800 hover:text-gray-900 transition-colors">
            Crea una cuenta aquí
          </Link>
        </div>
        <div className="my-8 border-t border-gray-200"></div>
        <div className="flex items-center justify-center space-x-4">
          <Link to="/" className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
            Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}