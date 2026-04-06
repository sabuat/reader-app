import { supabase } from '@/lib/supabase';
import { Book, Chapter, ReadingProgress } from '@/lib/types';
import { SupportedLanguage } from '@/lib/preferences';

// ==========================================
// CONSTANTES DE CONSULTA
// ==========================================
const BOOK_FIELDS = 'id, title, author, slug, description, published, chapters, cover_url, identificador, new, genre, language, ad_views, paginas, asin, link_amazon';
const CHAPTER_FIELDS = 'id, book_id, chapter_number, title, content';
const PROGRESS_FIELDS = 'id, user_id, book_id, chapter_number, completed_chapters, last_read_at';

const FALLBACK_ORDER = Number.MAX_SAFE_INTEGER;

export interface CatalogOptions {
  limit?: number;
  offset?: number;
  genre?: string;
  language?: string;
}

// 🌟 TIPADO MEJORADO: Respuestas normalizadas ('book' siempre será un único Book)
export interface SavedBookItem {
  id: string;
  book_id: string;
  book: Book;
}

export interface ReadingBookItem {
  chapter_number: number;
  completed_chapters: number[];
  last_read_at: string;
  book_id: string;
  book: Book;
}

// ==========================================
// 🌟 CACHÉ LIGERA EN MEMORIA
// ==========================================
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos de vida útil
const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export const BookService = {
  // ==========================================
  // CATÁLOGO
  // ==========================================
  
  async getAllBooks(activeLanguage: SupportedLanguage = 'es', options?: CatalogOptions): Promise<Book[]> {
    // 🌟 Uso de Caché
    const cacheKey = `books_${activeLanguage}_${JSON.stringify(options || {})}`;
    const cached = getCached<Book[]>(cacheKey);
    if (cached) return cached;

    let query = supabase.from('books').select(BOOK_FIELDS);

    if (options?.genre) query = query.eq('genre', options.genre);
    if (options?.language) query = query.eq('language', options.language);
    if (options?.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`[BookService.getAllBooks] ${error.message}`);
    
    const books = [...(data as Book[])];

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

    setCache(cacheKey, books);
    return books;
  },

  // ==========================================
  // LECTURA DE CAPÍTULOS
  // ==========================================

  async getChapters(bookId: string): Promise<Chapter[]> {
    const cacheKey = `chapters_${bookId}`;
    const cached = getCached<Chapter[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('chapters')
      .select(CHAPTER_FIELDS)
      .eq('book_id', bookId)
      .order('chapter_number', { ascending: true });
      
    if (error) throw new Error(`[BookService.getChapters] ${error.message}`);
    
    setCache(cacheKey, data);
    return data as Chapter[];
  },

  // ==========================================
  // MI LISTA (BOOKMARKS)
  // ==========================================

  async getMyList(userId: string): Promise<SavedBookItem[]> {
    const cacheKey = `mylist_${userId}`;
    const cached = getCached<SavedBookItem[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('my_list')
      .select(`id, book_id, books (${BOOK_FIELDS})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw new Error(`[BookService.getMyList] ${error.message}`);
    
    // 🌟 Normalización: extraemos 'books' como un solo 'book' para facilitar UI
    const normalized = (data as Record<string, unknown>[]).map((item: any) => ({
      id: item.id,
      book_id: item.book_id,
      book: Array.isArray(item.books) ? item.books[0] : item.books
    })) as SavedBookItem[];

    setCache(cacheKey, normalized);
    return normalized;
  },

  async addToMyList(userId: string, bookId: string): Promise<void> {
    const { error } = await supabase
      .from('my_list')
      .insert({ user_id: userId, book_id: bookId });
      
    if (error) throw new Error(`[BookService.addToMyList] ${error.message}`);
    invalidateCache(`mylist_${userId}`); // 🌟 Invalidar caché al mutar
  },

  async removeFromMyList(userId: string, bookId: string): Promise<void> {
    const { error } = await supabase
      .from('my_list')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);
      
    if (error) throw new Error(`[BookService.removeFromMyList] ${error.message}`);
    invalidateCache(`mylist_${userId}`); // 🌟 Invalidar caché al mutar
  },

  async checkIfInMyList(userId: string, bookId: string): Promise<boolean> {
    // Si ya tenemos la lista en caché, buscamos ahí directamente sin gastar un request
    const cacheKey = `mylist_${userId}`;
    const cached = getCached<SavedBookItem[]>(cacheKey);
    if (cached) {
      return cached.some(item => item.book_id === bookId);
    }

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
    if (!progress.user_id || !progress.book_id) {
      throw new Error('[BookService.updateProgress] user_id y book_id son requeridos.');
    }

    const { error } = await supabase
      .from('reading_progress')
      .upsert(progress, { onConflict: 'user_id,book_id' });
      
    if (error) throw new Error(`[BookService.updateProgress] ${error.message}`);
    invalidateCache(`readings_${progress.user_id}`); // 🌟 Invalidar caché al mutar
  },

  async getMyReadings(userId: string): Promise<ReadingBookItem[]> {
    const cacheKey = `readings_${userId}`;
    const cached = getCached<ReadingBookItem[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('reading_progress')
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
    
    // 🌟 Normalización de array problemático a objeto singular
    const normalized = (data as Record<string, unknown>[]).map((item: any) => ({
      chapter_number: item.chapter_number,
      completed_chapters: item.completed_chapters || [],
      last_read_at: item.last_read_at,
      book_id: item.book_id,
      book: Array.isArray(item.books) ? item.books[0] : item.books
    })) as ReadingBookItem[];

    setCache(cacheKey, normalized);
    return normalized;
  }
};