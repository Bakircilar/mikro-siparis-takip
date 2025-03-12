// src/services/preferencesService.js
import { supabase } from '../config/supabase';

// Kullanıcı tercihlerini yükle
export async function loadUserPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from('kullanici_tercihleri')
      .select('*')
      .eq('kullanici_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116: Veri bulunamadı hatası
      throw error;
    }
    
    if (data) {
      return { success: true, preferences: data };
    } else {
      // Varsayılan tercihleri oluştur
      return { success: true, preferences: {
        kolon_tercihleri: [],
        filtre_tercihleri: {},
        tema_tercihleri: {}
      }};
    }
  } catch (error) {
    console.error('Tercihler yüklenirken hata:', error);
    return { success: false, message: 'Kullanıcı tercihleri yüklenemedi.' };
  }
}

// Kullanıcı tercihlerini kaydet
export async function saveUserPreferences(userId, preferencesData) {
  try {
    // Önce tercihin var olup olmadığını kontrol et
    const { data: existing } = await supabase
      .from('kullanici_tercihleri')
      .select('id')
      .eq('kullanici_id', userId)
      .single();
      
    let result;
    
    if (existing) {
      // Mevcut tercihi güncelle
      result = await supabase
        .from('kullanici_tercihleri')
        .update({
          ...preferencesData,
          son_guncelleme: new Date().toISOString()
        })
        .eq('kullanici_id', userId)
        .select()
        .single();
    } else {
      // Yeni tercih oluştur
      result = await supabase
        .from('kullanici_tercihleri')
        .insert([{
          kullanici_id: userId,
          ...preferencesData,
          son_guncelleme: new Date().toISOString()
        }])
        .select()
        .single();
    }
    
    if (result.error) throw result.error;
    
    return { success: true, preferences: result.data };
  } catch (error) {
    console.error('Tercihler kaydedilirken hata:', error);
    return { success: false, message: 'Kullanıcı tercihleri kaydedilemedi.' };
  }
}

// Kolon tercihlerini kaydet
export async function saveColumnPreferences(userId, hiddenColumns) {
  return saveUserPreferences(userId, { kolon_tercihleri: hiddenColumns });
}

// Filtre tercihlerini kaydet
export async function saveFilterPreferences(userId, filterPreferences) {
  return saveUserPreferences(userId, { filtre_tercihleri: filterPreferences });
}