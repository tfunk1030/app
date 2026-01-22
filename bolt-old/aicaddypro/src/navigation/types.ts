export type RootStackParamList = {
  Home: undefined;
  Calculator: { initialYardage?: number };
  Wind: { compassHeading?: number };
  Settings: undefined;
};

export interface ClubData {
  name: string;
  normalYardage: number;
  loft: number;
}
