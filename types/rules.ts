import type { Color, Category } from './clothing';

export interface CustomColorRule {
  id: string;
  name?: string;
  colors: Color[];
  enabled: boolean;
  createdAt: string;
}

export interface CustomStyleRule {
  id: string;
  name?: string;
  categories: Category[];
  enabled: boolean;
  createdAt: string;
}
