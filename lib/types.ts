// Define exactamente qué forma tiene un Usuario
export interface Profile {
  id: string;
  username: string;
  full_name: string;
  dob: string;
  country: string;
  avatar_url: string;
  font_size?: string;
  night_mode?: boolean;
}

// Define exactamente qué forma tiene un Libro
export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  language: string;
  cover_url: string;
  published: boolean;
  ad_views?: number;
  description?: string;
}

// Define exactamente qué forma tiene un Capítulo
export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  content: string;
  created_at?: string;
}

// Define el Progreso de Lectura
export interface ReadingProgress {
  id?: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  completed_chapters: number[];
  last_read_at: string;
}