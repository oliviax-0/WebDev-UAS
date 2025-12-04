# Amadeus Test API - Informasi Penting

## Status Saat Ini

Aplikasi ini menggunakan **Amadeus Test Environment** yang memiliki keterbatasan:

### Keterbatasan Test API:

1. ✗ Data terbatas - hanya sampel untuk testing
2. ✗ Tidak semua maskapai tersedia
3. ✗ Tidak semua rute tersedia
4. ✗ Data tidak real-time
5. ✗ Tanggal terbatas

### Rute Test yang Disarankan untuk Amadeus Test API:

Coba gunakan rute internasional populer ini yang biasanya memiliki lebih banyak data di Test Environment:

**Rute Eropa:**

- MAD → BCN (Madrid → Barcelona)
- PAR → LON (Paris → London)
- NYC → LON (New York → London)

**Rute Asia-Eropa:**

- SYD → BKK (Sydney → Bangkok)
- NYC → PAR (New York → Paris)

**Rute populer lainnya:**

- NYC → LAX (New York → Los Angeles)
- LON → PAR (London → Paris)

### Untuk Rute Indonesia (CGK-KNO):

Amadeus Test Environment memiliki **sangat sedikit** atau **tidak ada** data untuk rute domestik Indonesia. Ini sebabnya Anda hanya melihat Batik Air (jika ada).

## Solusi:

### Opsi 1: Upgrade ke Production API (Direkomendasikan untuk Project Real)

**Cara:**

1. Buat akun Production di: https://developers.amadeus.com/
2. Subscribe ke Self-Service plan (ada free tier)
3. Dapatkan Production API credentials
4. Update kode:

```python
amadeus = Client(
    client_id='YOUR_PRODUCTION_CLIENT_ID',
    client_secret='YOUR_PRODUCTION_CLIENT_SECRET',
    hostname='production'
)
```

**Keuntungan Production:**

- ✓ Real-time data dari semua maskapai
- ✓ Semua rute tersedia (termasuk CGK-KNO)
- ✓ Data akurat dan up-to-date
- ✓ Lebih banyak pilihan maskapai

### Opsi 2: Demo dengan Rute Test (Untuk UAS/Assignment)

Jika ini untuk UAS dan tidak butuh data real Indonesia:

1. Gunakan rute test seperti NYC → LAX atau LON → PAR
2. Dokumentasikan bahwa ini "Demo dengan Test Data"
3. Jelaskan di dokumentasi bahwa Production API akan show real data

### Opsi 3: Mock Data Lokal (Alternatif)

Tambahkan dummy data lokal untuk maskapai Indonesia sebagai fallback jika Test API tidak mengembalikan hasil.

## Kesimpulan:

Yang Anda alami adalah **normal** untuk Amadeus Test Environment. Test API memang dirancang dengan data terbatas untuk development/testing purposes, bukan untuk menampilkan semua maskapai yang sebenarnya tersedia.

Untuk mendapatkan data lengkap maskapai Indonesia seperti Garuda, Lion Air, Citilink, dll., Anda perlu menggunakan **Production API**.
