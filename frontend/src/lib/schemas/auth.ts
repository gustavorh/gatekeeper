import { z } from "zod";
import { isValidRutFormat } from "@/lib/validators/rut";

export const loginSchema = z.object({
  rut: z
    .string()
    .min(1, "RUT es obligatorio")
    .refine(isValidRutFormat, {
      message: "Formato RUT inválido (ej. 12345678-9)",
    }),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  rut: z
    .string()
    .min(1, "RUT es obligatorio")
    .refine(isValidRutFormat, {
      message: "Formato RUT inválido (ej. 12345678-9)",
    }),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  firstName: z.string().min(1, "Nombre es obligatorio"),
  lastName: z.string().min(1, "Apellido es obligatorio"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
