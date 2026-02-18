import { Link, useNavigate } from "react-router";
import { z, treeifyError } from "zod";
import { useState } from "react";
import { toast } from "sonner";

import { signUp } from "@/lib/auth-client";
import { Eye, EyeClosed } from "lucide-react";

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
    lastName: z.string().trim().min(2, "El apellido debe tener al menos 2 caracteres"),
    email: z.email("Correo electrónico inválido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula")
      .regex(/[a-z]/, "Debe incluir al menos una letra minúscula")
      .regex(/[0-9]/, "Debe incluir al menos un número"),
    confirmPassword: z.string().min(1, "Debes confirmar tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const initialFormValues: RegisterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<RegisterFormValues>(initialFormValues);

  const handleInputChange = (field: keyof RegisterFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const parsedForm = registerSchema.safeParse(formValues);
    if (!parsedForm.success) {
      const errors = treeifyError(parsedForm.error);
      toast.error(errors.errors?.[0] ?? errors.errors?.[0] ?? "Datos inválidos");
      return;
    }

    try {
      setIsSubmitting(true);

      const fullName = `${parsedForm.data.firstName.trim()} ${parsedForm.data.lastName.trim()}`.trim();

      const result = await signUp.email({
        name: fullName,
        email: parsedForm.data.email.trim().toLowerCase(),
        password: parsedForm.data.password,
        callbackURL: `${import.meta.env.VITE_AUTH_BASE_URL ?? "http://localhost:5173"}/?auth=success`,
      });

      if (result.error) {
        toast.error(result.error.message ?? "No se pudo crear la cuenta. Intenta nuevamente.");
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
        <h1 className="text-2xl font-bold text-center mb-2">Creación de cuenta</h1>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre</label>
            <input
              id="nombre"
              type="text"
              placeholder="Ingresa tu nombre"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={formValues.firstName}
              onChange={handleInputChange("firstName")}
              required
            />
          </div>
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium mb-1">Apellido</label>
            <input
              id="apellido"
              type="text"
              placeholder="Ingresa tu apellido"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={formValues.lastName}
              onChange={handleInputChange("lastName")}
              required
            />
          </div>
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
            <label htmlFor="password" className="block text-sm font-medium mb-1">Ingresa tu contraseña</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresar contraseña"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black pr-10"
                autoComplete="new-password"
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
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">Confirma tu contraseña</label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ingresar contraseña"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black pr-10"
                autoComplete="new-password"
                value={formValues.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
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
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirmPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeClosed className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full cursor-pointer bg-black text-white font-semibold py-2 rounded-md mt-4 hover:bg-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando cuenta..." : "Continuar"}
          </button>
        </form>
        <div className="my-8 border-t border-gray-200"></div>
        <div className="flex items-center justify-center space-x-2 text-center text-sm">
          <span className="font-medium">¿Ya tienes una cuenta?</span>
          <span>&rarr;</span>
          <Link to="/login" className="underline font-medium text-gray-800 hover:text-gray-900 transition-colors">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}