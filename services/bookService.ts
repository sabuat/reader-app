import { supabase } from '@/lib/supabase';
import { Book, Chapter, ReadingProgress } from '@/lib/types';
import { SupportedLanguage } from '@/lib/preferences';

// ==========================================
// CONSTANTES DE CONSULTA (Evitar select '*')
// ==========================================
const BOOK_FIELDS = 'id, title, author, slug, description, published, chapters, cover_url, identificador, new, genre, language, ad_views, paginas, asin, link_amazon';
// ¡CORREGIDO!: Se eliminó 'created_at' que no existe en tu BD
const CHAPTER_FIELDS = 'id, book_id, chapter_number, title, content';
const PROGRESS_FIELDS = 'id, user_id, book_id, chapter_number, completed_chapters, last_read_at';

const FALLBACK_ORDER = Number.MAX_SAFE_INTEGER;

export interface CatalogOptions {
  limit?: number;
  offset?: number;
  genre?: string;
  language?: string;
}

// Interfaces para tipar los retornos con joins de Supabase
export interface SavedBookItem {
  id: string;
  book_id: string;
  books: Book | Book[];
}

export interface ReadingBookItem {
  chapter_number: number;
  completed_chapters: number[];
  last_read_at: string;
  book_id: string;
  books: Book | Book[];
}

export const BookService = {
  // ==========================================
  // CATÁLOGO
  // ==========================================
  
  // Obtiene los libros preparando el terreno para server-side filtering y paginación
  async getAllBooks(activeLanguage: SupportedLanguage = 'es', options?: CatalogOptions): Promise<Book[]> {
    let query = supabase.from('books').select(BOOK_FIELDS);

    // Preparación para Server-Side Filtering futuro
    if (options?.genre) query = query.eq('genre', options.genre);
    if (options?.language) query = query.eq('language', options.language);

    // Preparación para paginación futura
    if (options?.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`[BookService.getAllBooks] ${error.message}`);
    
    // Evitamos mutar el array original devolviendo una copia ordenada
    const books = [...(data as Book[])];

    // Reglas de negocio de ordenamiento local (Publicados -> Idioma -> Identificador)
    books.sort((a, b) => {
      if (a.published !== b.published) {
        return a.published ? -1 : 1; 
      }

      if (a.published) {
        const langA = (a.language || '').toUpperCase();
        const langB = (b.language || '').toUpperCase();
        const currentLang = activeLanguage.toUpperCase();

        const aIsActiveLang = langA === currentLang;
        const bIsActiveLang = langB === currentLang;

        if (aIsActiveLang !== bIsActiveLang) {
          return aIsActiveLang ? -1 : 1;
        }
      }

      const idA = a.identificador ?? FALLBACK_ORDER;
      const idB = b.identificador ?? FALLBACK_ORDER;
      return idA - idB;
    });

    return books;
  },

  // ==========================================
  // LECTURA DE CAPÍTULOS
  // ==========================================

  async getChapters(bookId: string): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select(CHAPTER_FIELDS)
      .eq('book_id', bookId)
      .order('chapter_number', { ascending: true });
      
    if (error) throw new Error(`[BookService.getChapters] ${error.message}`);
    return data as Chapter[];
  },

  // ==========================================
  // MI LISTA (BOOKMARKS)
  // ==========================================

  async getMyList(userId: string): Promise<SavedBookItem[]> {
    const { data, error } = await supabase
      .from('my_list')
      // Relación explícita evitando select(*)
      .select(`id, book_id, books (${BOOK_FIELDS})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw new Error(`[BookService.getMyList] ${error.message}`);
    return data as SavedBookItem[];
  },

  async addToMyList(userId: string, bookId: string): Promise<void> {
    const { error } = await supabase
      .from('my_list')
      .insert({ user_id: userId, book_id: bookId });
      
    if (error) throw new Error(`[BookService.addToMyList] ${error.message}`);
  },

  async removeFromMyList(userId: string, bookId: string): Promise<void> {
    const { error } = await supabase
      .from('my_list')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);
      
    if (error) throw new Error(`[BookService.removeFromMyList] ${error.message}`);
  },

  async checkIfInMyList(userId: string, bookId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('my_list')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('book_id', bookId);
      
    if (error) throw new Error(`[BookService.checkIfInMyList] ${error.message}`);
    return !!count;
  },

  // ==========================================
  // PROGRESO DE LECTURA
  // ==========================================

  async getReadingProgress(userId: string, bookId: string): Promise<ReadingProgress | null> {
    const { data, error } = await supabase
      .from('reading_progress')
      .select(PROGRESS_FIELDS)
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') {
      throw new Error(`[BookService.getReadingProgress] ${error.message}`);
    }
    return data as ReadingProgress | null;
  },

  async updateProgress(progress: Partial<ReadingProgress>): Promise<void> {
    // Validamos campos mínimos requeridos
    if (!progress.user_id || !progress.book_id) {
      throw new Error('[BookService.updateProgress] user_id y book_id son requeridos para actualizar el progreso.');
    }

    const { error } = await supabase
      .from('reading_progress')
      .upsert(progress, { onConflict: 'user_id,book_id' });
      
    if (error) throw new Error(`[BookService.updateProgress] ${error.message}`);
  },

  async getMyReadings(userId: string): Promise<ReadingBookItem[]> {
    const { data, error } = await supabase
      .from('reading_progress')
      // Inner join estricto con select explícito
      .select(`
        chapter_number,
        completed_chapters,
        last_read_at,
        book_id,
        books (id, title, author, cover_url, chapters)
      `)
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false });
      
    if (error) throw new Error(`[BookService.getMyReadings] ${error.message}`);
    return data as ReadingBookItem[];
  }
};