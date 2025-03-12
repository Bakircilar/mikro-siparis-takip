import { supabase } from '../config/supabase';

// Kullanıcı girişi
export async function loginUser(username, password) {
  try {
    const { data, error } = await supabase
      .from('kullanicilar')
      .select('*')
      .eq('kullanici_adi', username)
      .eq('sifre', password)
      .eq('aktif', true)
      .single();
    
    if (error) throw error;
    
    if (data) {
      // Son giriş zamanını güncelle
      await supabase
        .from('kullanicilar')
        .update({ son_giris: new Date().toISOString() })
        .eq('id', data.id);
      
      return {
        success: true,
        userRole: data.rol,
        filterCriteria: data.filtre,
        userData: data
      };
    } else {
      return { success: false, message: 'Geçersiz kullanıcı adı veya şifre!' };
    }
  } catch (error) {
    console.error('Giriş hatası:', error);
    return { success: false, message: 'Giriş sırasında bir hata oluştu.' };
  }
}

// Tüm kullanıcıları getir (sadece admin için)
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('kullanicilar')
      .select('*')
      .order('kullanici_adi');
    
    if (error) throw error;
    
    return { success: true, users: data };
  } catch (error) {
    console.error('Kullanıcılar getirilirken hata:', error);
    return { success: false, message: 'Kullanıcılar yüklenirken bir hata oluştu.' };
  }
}

// Yeni kullanıcı ekle
export async function addUser(userData) {
  try {
    // Kullanıcı adının benzersiz olup olmadığını kontrol et
    const { data: existingUser } = await supabase
      .from('kullanicilar')
      .select('id')
      .eq('kullanici_adi', userData.kullanici_adi)
      .single();
    
    if (existingUser) {
      return { success: false, message: 'Bu kullanıcı adı zaten kullanılıyor.' };
    }
    
    const { data, error } = await supabase
      .from('kullanicilar')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, user: data };
  } catch (error) {
    console.error('Kullanıcı eklenirken hata:', error);
    return { success: false, message: 'Kullanıcı eklenirken bir hata oluştu.' };
  }
}

// Kullanıcı güncelle
export async function updateUser(id, userData) {
  try {
    // Kullanıcı adı değiştiyse benzersizlik kontrolü yap
    if (userData.kullanici_adi) {
      const { data: existingUser } = await supabase
        .from('kullanicilar')
        .select('id')
        .eq('kullanici_adi', userData.kullanici_adi)
        .neq('id', id)
        .single();
      
      if (existingUser) {
        return { success: false, message: 'Bu kullanıcı adı zaten kullanılıyor.' };
      }
    }
    
    const { data, error } = await supabase
      .from('kullanicilar')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, user: data };
  } catch (error) {
    console.error('Kullanıcı güncellenirken hata:', error);
    return { success: false, message: 'Kullanıcı güncellenirken bir hata oluştu.' };
  }
}

// Kullanıcı sil (aktif = false yapar)
export async function deactivateUser(id) {
  try {
    const { data, error } = await supabase
      .from('kullanicilar')
      .update({ aktif: false })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, user: data };
  } catch (error) {
    console.error('Kullanıcı pasif yapılırken hata:', error);
    return { success: false, message: 'Kullanıcı pasif yapılırken bir hata oluştu.' };
  }
}

// Kullanıcı aktifleştir
export async function activateUser(id) {
  try {
    const { data, error } = await supabase
      .from('kullanicilar')
      .update({ aktif: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, user: data };
  } catch (error) {
    console.error('Kullanıcı aktif yapılırken hata:', error);
    return { success: false, message: 'Kullanıcı aktif yapılırken bir hata oluştu.' };
  }
}