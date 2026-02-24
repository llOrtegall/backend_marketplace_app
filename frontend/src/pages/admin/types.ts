export type AdminProduct = {
  id: string;
  name: string;
  description: string | null;
  value: string;
  price: string;
  stock: number;
  isActive: boolean;
  image: string;
  imageUrl: string;
};

export type ProductFormData = {
  name: string;
  description: string;
  value: string;
  price: string;
  stock: string;
  isActive: boolean;
};

export const emptyFormData: ProductFormData = {
  name: "",
  description: "",
  value: "",
  price: "",
  stock: "0",
  isActive: true,
};
