import { Address } from "./Address";
import { Tag } from "./Tag";

export interface Profile {
  id: string;
  fullName: string;
  gender: string;
  avatarUrl: string;
  budgetMin: number;
  budgetMax: number;
  isSmoker: boolean | null;
  hasPet: boolean | null;
  sleepSchedule: string | null;
  cleanliness: number | null;
  hometown: string;
  workplace: string;
  address: Address;
  tags: Tag[];
}
