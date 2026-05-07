export type Sign = {
  id: number;
  imagePath: string; // e.g. "images/v1_txt005_25.jpg", relative to data/sign-database/
  description: string;
  sourceEntry: string | null;
  letter: string;
  volume: number;
  theme: string | null;
};

export type Meaning = {
  id: number;
  signId: number;
  text: string;
  variantIndex: number | null;
  orderInEntry: number | null;
};

export type Theme = {
  name: string;
  difficultyRank: number;
  tier: string;
};
