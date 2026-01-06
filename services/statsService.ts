
import { supabase } from './supabaseClient';

export const statsService = {
  /**
   * Gọi hàm increment_views trên Postgres để tăng lượt xem và trả về giá trị mới nhất
   */
  incrementViewCount: async (): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('increment_views');
      
      if (error) {
        console.error('Lỗi khi tăng lượt xem:', error);
        // Fallback: lấy dữ liệu hiện tại nếu hàm rpc lỗi
        const { data: fallbackData } = await supabase
          .from('site_stats')
          .select('view_count')
          .eq('id', 1)
          .single();
        return fallbackData?.view_count || 0;
      }
      
      return data as number;
    } catch (err) {
      console.error('Stats Service Error:', err);
      return 0;
    }
  },

  /**
   * Chỉ lấy số lượt xem hiện tại (không tăng)
   */
  getCurrentViews: async (): Promise<number> => {
    const { data, error } = await supabase
      .from('site_stats')
      .select('view_count')
      .eq('id', 1)
      .single();
    
    if (error) return 0;
    return data?.view_count || 0;
  }
};
