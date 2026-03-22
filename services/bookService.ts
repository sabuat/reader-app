import { supabase } from '@/lib/supabase';
import { Book, Chapter, ReadingProgress } from '@/lib/types';

export const BookService = {
// 📚 1. CATÁLOGO: Obtener todos los libros
  async getAllBooks(): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('identificador', { ascending: true });
      
    if (error) throw error;
    return data as Book[];
  },

  // 📖 2. CAPÍTULOS: Obtener los capítulos de un libro en orden
  async getChapters(bookId: string): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number', { ascending: true });
      
    if (error) throw error;
    return data as Chapter[];
  },

  // 🔖 3. MI LISTA: Obtener todos los libros guardados por el usuario
  async getMyList(userId: string) {
    const { data, error } = await supabase
      .from('my_list')
      .select(`id, book_id, books (*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  // ➕ 4. MI LISTA: Guardar un libro
  async addToMyList(userId: string, bookId: string) {
    const { error } = await supabase
      .from('my_list')
      .insert({ user_id: userId, book_id: bookId });
      
    if (error) throw error;
  },

  // ➖ 5. MI LISTA: Eliminar un libro
  async removeFromMyList(userId: string, bookId: string) {
    const { error } = await supabase
      .from('my_list')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);
      
    if (error) throw error;
  },

  // 🔍 6. MI LISTA: Verificar si un libro ya está guardado
  async checkIfInMyList(userId: string, bookId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('my_list')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('book_id', bookId);
      
    if (error) throw error;
    return (count && count > 0) ? true : false;
  },

  // 📈 7. PROGRESO: Obtener por dónde va el usuario
  async getReadingProgress(userId: string, bookId: string): Promise<ReadingProgress | null> {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data as ReadingProgress | null;
  },

  // 💾 8. PROGRESO: Guardar avance del usuario
  async updateProgress(progress: ReadingProgress) {
    const { error } = await supabase
      .from('reading_progress')
      .upsert(progress, { onConflict: 'user_id,book_id' });
      
    if (error) throw error;
  },

  // 📚 9. LECTURAS: Obtener todos los libros que el usuario está leyendo
  async getMyReadings(userId: string) {
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
      
    if (error) throw error;
    return data;
  }
};