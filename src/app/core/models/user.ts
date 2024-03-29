export interface UserInterface {
  email?: string;
  uid?: string;
  empresaNombre?: string;
  role?: number; // 0:usuario | 1:admin | 2: externo | 3: procesamiento
  plantas?: string[];
  color?: string;
  photoURL?: string;
  emailVerified?: boolean;
  criterioId?: string;
  empresaId?: string;
}
