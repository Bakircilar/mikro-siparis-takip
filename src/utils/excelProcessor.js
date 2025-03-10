// src/utils/excelProcessor.js
import * as XLSX from 'xlsx';
import { supabase } from '../config/supabase';

export async function processExcelAndSyncToSupabase(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        // İlk sayfayı al
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // JSON'a dönüştür
        const excelData = XLSX.utils.sheet_to_json(worksheet);
        
        if (excelData.length === 0) {
          reject(new Error('Excel dosyası boş veya uyumsuz formatta.'));
          return;
        }
        
        // Supabase'deki mevcut siparişleri al
        const { data: existingOrders, error } = await supabase
          .from('siparisler')
          .select('msg_s_0088');
          
        if (error) {
          reject(error);
          return;
        }
        
        // Mevcut sipariş ID'lerini ve Excel'deki ID'leri topla
        const existingOrderIds = new Set(existingOrders.map(order => order.msg_s_0088));
        const excelOrderIds = new Set();
        
        let addedCount = 0;
        let updatedCount = 0;
        
        // Excel verilerini işle
        for (const row of excelData) {
          // Excel'den gelen benzersiz ID
          const uniqueId = row['#msg_S_0088'] || row['msg_S_0088'];
          
          if (!uniqueId) {
            console.warn('ID olmayan satır atlandı:', row);
            continue;
          }
          
          excelOrderIds.add(uniqueId);
          
          // Excel verilerini Supabase formatına dönüştür
          const orderData = {
            msg_s_0088: uniqueId,
            bakiye: row['Bakiye'] || null,
            f_1: row['F-1'] || null,
            f_5: row['F-5'] || null,
            p_1: row['P-1'] || null,
            p_5: row['P-5'] || null,
            son_giris_maliyeti: row['Son Giriş Maliyeti + Kdv'] || null,
            son_giris_tarihi: formatDate(row['Son Giriş Tarihi']),
            guncel_maliyet: row['Güncel Maliyet'] || null,
            stok_kodu: row['msg_S_0078'] || null,
            urun_adi: row['msg_S_0070'] || null,
            birim: row['#msg_S_0010'] || null,
            marka: row['#msg_S_0024'] || null,
            musteri_kodu: row['msg_S_0200'] || null,
            musteri_adi: row['msg_S_0201'] || null,
            siparis_tarihi: formatDate(row['#msg_S_0240']),
            teslim_tarihi: formatDate(row['msg_S_0241']),
            belge_no: row['msg_S_0243'] || null,
            sira_no: row['msg_S_0157'] || null,
            siparis_deposu: row['msg_S_0159'] || null,
            merkez_depo_miktar: row['Merkez'] || null,
            topca_depo_miktar: row['Topca Dükkan'] || null,
            siparis_miktar: row['#msg_S_0244'] || null,
            birim_fiyat: row['msg_S_0248'] || null,
            toplam_tutar: row['msg_S_0249'] || null,
            kalan_tutar: row['msg_S_0253'] || null,
            aciklama: row['#msg_S_0260'] || null,
            sektor_kodu: row['#msg_S_0474'] || null,
            grup_kodu: row['#msg_S_0471'] || null,
            sehir: row['#msg_S_0202'] || null,
            vade: row['#msg_S_0099'] || null,
            siparis_giren: row['#msg_S_1130'] || null,
            son_guncelleme: new Date().toISOString(),
            aktif: true
          };
          
          // Yeni sipariş ekle veya mevcut siparişi güncelle
          if (!existingOrderIds.has(uniqueId)) {
            // Yeni sipariş ekle
            const { error: insertError } = await supabase
              .from('siparisler')
              .insert([orderData]);
              
            if (insertError) {
              console.error(`Sipariş eklenirken hata (${uniqueId}):`, insertError);
            } else {
              addedCount++;
            }
          } else {
            // Mevcut siparişi güncelle
            const { error: updateError } = await supabase
              .from('siparisler')
              .update(orderData)
              .eq('msg_s_0088', uniqueId);
              
            if (updateError) {
              console.error(`Sipariş güncellenirken hata (${uniqueId}):`, updateError);
            } else {
              updatedCount++;
            }
          }
        }
        
        // Excel'de olmayan siparişleri pasif yap
        let deactivatedCount = 0;
        for (const existingOrder of existingOrders) {
          if (!excelOrderIds.has(existingOrder.msg_s_0088)) {
            const { error: updateError } = await supabase
              .from('siparisler')
              .update({ aktif: false, son_guncelleme: new Date().toISOString() })
              .eq('msg_s_0088', existingOrder.msg_s_0088);
              
            if (updateError) {
              console.error(`Sipariş pasifleştirilirken hata (${existingOrder.msg_s_0088}):`, updateError);
            } else {
              deactivatedCount++;
            }
          }
        }
        
        resolve({
          added: addedCount,
          updated: updatedCount,
          deactivated: deactivatedCount
        });
        
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Tarih formatını düzeltme fonksiyonu
function formatDate(dateValue) {
  if (!dateValue) return null;
  
  try {
    // Excel tarihi bir sayı olabilir (Excel'in serial date formatı)
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD formatı
    }
    
    // Tarih zaten bir tarih nesnesi ise
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0]; // YYYY-MM-DD formatı
    }
    
    // Tarih bir string ise
    if (typeof dateValue === 'string') {
      // DD.MM.YYYY formatını kontrol et
      if (dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const parts = dateValue.split('.');
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD formatına çevir
      }
      
      // DD/MM/YYYY formatını kontrol et
      if (dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parts = dateValue.split('/');
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD formatına çevir
      }
      
      // Diğer formatları parse etmeyi dene
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD formatı
      }
    }
    
    console.warn(`Geçersiz tarih değeri: ${dateValue}`);
    return null;
  } catch (error) {
    console.warn(`Tarih dönüştürme hatası: ${dateValue}`, error);
    return null;
  }
}