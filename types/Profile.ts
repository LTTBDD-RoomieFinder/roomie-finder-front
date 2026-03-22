import { Address } from "./Address";
import { Tag } from "./Tag";

export interface Profile {
  id: string;
  fullName: string;
  gender: string;
  avatarUrl: string;
  budgetMin: number;
  budgetMax: number;
  isSmoker: boolean;
  hasPet: boolean;
  sleepSchedule: string;
  cleanliness: number;
  hometown: string;
  workplace: string;
  address: Address;
  tags: Tag[];
}
