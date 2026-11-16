<?php

namespace Tests\Feature;

use App\Models\Promo;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PromoEditAndCardTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected ServiceCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::first() ?? User::factory()->create([
            'email' => 'admin@test.com',
            'role' => 'admin',
        ]);

        $this->category = ServiceCategory::first() ?? ServiceCategory::create([
            'name' => 'Layanan Cloud',
            'slug' => 'layanan-cloud',
            'sort_order' => 1,
        ]);
    }

    /**
     * Test 1: Tambah promo baru dengan validasi create tetap berfungsi
     */
    public function test_create_promo_validation_and_success(): void
    {
        $this->actingAs($this->admin);

        // Validasi wajib (create mewajibkan title)
        $response = $this->post(route('admin.promos.store'), []);
        $response->assertSessionHasErrors(['title']);

        // Create berhasil
        $data = [
            'title' => 'Promo Server Hemat 2026',
            'slug' => 'promo-server-hemat-2026',
            'service_category_id' => $this->category->id,
            'description' => 'Diskon server 20%',
            'discount_type' => 'percentage',
            'original_price' => 1000000,
            'discount_percentage' => 20,
            'is_active' => 1,
            'show_on_home' => 1,
            'sort_order' => 1,
        ];

        $response = $this->post(route('admin.promos.store'), $data);
        $response->assertRedirect(route('admin.promos.index'));
        $this->assertDatabaseHas('promos', [
            'slug' => 'promo-server-hemat-2026',
            'final_price' => 800000,
        ]);
    }

    /**
     * Test 2: Partial update - Hanya edit deskripsi tanpa mengisi ulang nama dan slug
     */
    public function test_partial_update_only_description(): void
    {
        $this->actingAs($this->admin);

        $promo = Promo::create([
            'title' => 'Promo Jaringan Kantor',
            'slug' => 'promo-jaringan-kantor',
            'description' => 'Deskripsi lama',
            'discount_type' => 'none',
            'original_price' => 500000,
            'final_price' => 500000,
            'is_active' => true,
        ]);

        $response = $this->put(route('admin.promos.update', $promo->id), [
            'description' => 'Deskripsi baru yang diperbarui tanpa mengisi ulang judul dan slug.',
        ]);

        $response->assertRedirect(route('admin.promos.index'));
        $promo->refresh();

        $this->assertEquals('Promo Jaringan Kantor', $promo->title);
        $this->assertEquals('promo-jaringan-kantor', $promo->slug);
        $this->assertEquals('Deskripsi baru yang diperbarui tanpa mengisi ulang judul dan slug.', $promo->description);
        $this->assertEquals(500000, $promo->original_price);
    }

    /**
     * Test 3: Partial update - Hanya edit harga promo
     */
    public function test_partial_update_only_price(): void
    {
        $this->actingAs($this->admin);

        $promo = Promo::create([
            'title' => 'Promo CCTV 8 Channel',
            'slug' => 'promo-cctv-8-channel',
            'description' => 'Paket CCTV lengkap',
            'discount_type' => 'fixed',
            'original_price' => 2000000,
            'discount_amount' => 200000,
            'final_price' => 1800000,
            'is_active' => true,
        ]);

        $response = $this->put(route('admin.promos.update', $promo->id), [
            'discount_type' => 'fixed',
            'original_price' => 2500000,
            'discount_amount' => 500000,
        ]);

        $response->assertRedirect(route('admin.promos.index'));
        $promo->refresh();

        $this->assertEquals('Promo CCTV 8 Channel', $promo->title);
        $this->assertEquals(2500000, $promo->original_price);
        $this->assertEquals(500000, $promo->discount_amount);
        $this->assertEquals(2000000, $promo->final_price);
    }

    /**
     * Test 4: Partial update - Hanya edit tanggal berakhir
     */
    public function test_partial_update_only_end_date(): void
    {
        $this->actingAs($this->admin);

        $promo = Promo::create([
            'title' => 'Promo Akhir Tahun',
            'slug' => 'promo-akhir-tahun',
            'description' => 'Hemat hingga akhir tahun',
            'discount_type' => 'none',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-25',
            'is_active' => true,
        ]);

        $response = $this->put(route('admin.promos.update', $promo->id), [
            'end_date' => '2026-11-30',
        ]);

        $response->assertRedirect(route('admin.promos.index'));
        $promo->refresh();

        $this->assertEquals('Promo Akhir Tahun', $promo->title);
        $this->assertEquals('2026-11-30 00:00:00', (string) $promo->end_date);
    }

    /**
     * Test 5: Partial update - Hanya edit CTA & WhatsApp
     */
    public function test_partial_update_only_cta(): void
    {
        $this->actingAs($this->admin);

        $promo = Promo::create([
            'title' => 'Promo Konsultasi Cloud',
            'slug' => 'promo-konsultasi-cloud',
            'discount_type' => 'none',
            'cta_text' => 'Kontak Lama',
            'cta_url' => '081234567890',
            'is_active' => true,
        ]);

        $response = $this->put(route('admin.promos.update', $promo->id), [
            'cta_text' => 'WhatsApp CS Kami',
            'cta_url' => '+628987654321',
        ]);

        $response->assertRedirect(route('admin.promos.index'));
        $promo->refresh();

        $this->assertEquals('WhatsApp CS Kami', $promo->cta_text);
        $this->assertEquals('+628987654321', $promo->cta_url);
    }

    /**
     * Test 6: Partial update gambar - Gambar lama tetap dipertahankan jika tidak diganti
     */
    public function test_update_preserves_existing_image_when_not_replaced(): void
    {
        $this->actingAs($this->admin);
        Storage::fake('public');

        $uploaded = UploadedFile::fake()->image('old_banner.jpg', 600, 400);
        $path = $uploaded->store('promos', 'public');

        $promo = Promo::create([
            'title' => 'Promo Dengan Banner',
            'slug' => 'promo-dengan-banner',
            'description' => 'Ada gambar',
            'image' => $path,
            'discount_type' => 'none',
            'is_active' => true,
        ]);

        // Update hanya deskripsi tanpa mengirim file image
        $response = $this->put(route('admin.promos.update', $promo->id), [
            'description' => 'Deskripsi berubah, gambar tetap utuh',
        ]);

        $response->assertRedirect(route('admin.promos.index'));
        $promo->refresh();

        $this->assertEquals($path, $promo->image);
        Storage::disk('public')->assertExists($path);
    }

    /**
     * Test 7: Update slug uniqueness - Mengabaikan ID sendiri saat update
     */
    public function test_update_slug_uniqueness_ignores_own_id(): void
    {
        $this->actingAs($this->admin);

        $promo1 = Promo::create([
            'title' => 'Promo Pertama',
            'slug' => 'promo-pertama',
            'discount_type' => 'none',
            'is_active' => true,
        ]);

        $promo2 = Promo::create([
            'title' => 'Promo Kedua',
            'slug' => 'promo-kedua',
            'discount_type' => 'none',
            'is_active' => true,
        ]);

        // Update promo1 dengan slug yang sama tidak boleh error unique
        $response = $this->put(route('admin.promos.update', $promo1->id), [
            'title' => 'Promo Pertama Revisi',
            'slug' => 'promo-pertama',
        ]);
        $response->assertSessionHasNoErrors();

        // Update promo1 dengan slug promo2 harus error unique
        $response2 = $this->put(route('admin.promos.update', $promo1->id), [
            'slug' => 'promo-kedua',
        ]);
        $response2->assertSessionHasErrors(['slug']);
    }

    /**
     * Test 8: Method spoofing PUT via POST (digunakan oleh form Inertia)
     */
    public function test_update_via_post_method_spoofing(): void
    {
        $this->actingAs($this->admin);

        $promo = Promo::create([
            'title' => 'Promo Inertia Spoof',
            'slug' => 'promo-inertia-spoof',
            'description' => 'Awal',
            'discount_type' => 'none',
            'is_active' => true,
        ]);

        $response = $this->post(route('admin.promos.update', $promo->id), [
            '_method' => 'PUT',
            'description' => 'Berhasil diperbarui melalui POST dengan _method=PUT',
        ]);

        $response->assertRedirect(route('admin.promos.index'));
        $promo->refresh();

        $this->assertEquals('Berhasil diperbarui melalui POST dengan _method=PUT', $promo->description);
    }

    /**
     * Test 9: Partial update - Hanya edit kategori promo
     */
    public function test_partial_update_only_category(): void
    {
        $this->actingAs($this->admin);

        $newCategory = ServiceCategory::create([
            'name' => 'Hardware & Server',
            'slug' => 'hardware-server',
            'sort_order' => 2,
        ]);

        $promo = Promo::create([
            'title' => 'Promo Pengadaan Server',
            'slug' => 'promo-pengadaan-server',
            'service_category_id' => $this->category->id,
            'discount_type' => 'none',
            'is_active' => true,
        ]);

        $response = $this->put(route('admin.promos.update', $promo->id), [
            'service_category_id' => $newCategory->id,
        ]);

        $response->assertRedirect(route('admin.promos.index'));
        $promo->refresh();

        $this->assertEquals($newCategory->id, $promo->service_category_id);
        $this->assertEquals('Promo Pengadaan Server', $promo->title);
    }

    /**
     * Test 10: Partial update - Hanya edit status promo (is_active, show_on_home, is_featured)
     */
    public function test_partial_update_only_status_and_flags(): void
    {
        $this->actingAs($this->admin);

        $promo = Promo::create([
            'title' => 'Promo Testing Flags',
            'slug' => 'promo-testing-flags',
            'discount_type' => 'none',
            'is_active' => true,
            'show_on_home' => true,
            'is_featured' => false,
        ]);

        $response = $this->put(route('admin.promos.update', $promo->id), [
            'is_active' => 0,
            'show_on_home' => 0,
            'is_featured' => 1,
        ]);

        $response->assertRedirect(route('admin.promos.index'));
        $promo->refresh();

        $this->assertFalse((bool) $promo->is_active);
        $this->assertFalse((bool) $promo->show_on_home);
        $this->assertTrue((bool) $promo->is_featured);
        $this->assertEquals('Promo Testing Flags', $promo->title);
    }

    /**
     * Test 11: Edit nama promo tidak mengubah slug lama jika slug tidak dikirim
     */
    public function test_edit_title_preserves_existing_slug(): void
    {
        $this->actingAs($this->admin);

        $promo = Promo::create([
            'title' => 'Nama Promo Lama',
            'slug' => 'slug-promo-lama',
            'discount_type' => 'none',
            'is_active' => true,
        ]);

        $response = $this->put(route('admin.promos.update', $promo->id), [
            'title' => 'Nama Promo Baru yang Direvisi',
        ]);

        $response->assertRedirect(route('admin.promos.index'));
        $promo->refresh();

        $this->assertEquals('Nama Promo Baru yang Direvisi', $promo->title);
        $this->assertEquals('slug-promo-lama', $promo->slug);
    }

    /**
     * Test 12: Ganti gambar promo - Gambar lama terhapus dan gambar baru tersimpan
     */
    public function test_replace_image_deletes_old_file(): void
    {
        $this->actingAs($this->admin);
        Storage::fake('public');

        $oldFile = UploadedFile::fake()->image('gambar_awal.jpg');
        $oldPath = $oldFile->store('promos', 'public');

        $promo = Promo::create([
            'title' => 'Promo Ganti Gambar',
            'slug' => 'promo-ganti-gambar',
            'image' => $oldPath,
            'discount_type' => 'none',
            'is_active' => true,
        ]);

        $newFile = UploadedFile::fake()->image('gambar_baru.png');

        $response = $this->put(route('admin.promos.update', $promo->id), [
            'image' => $newFile,
        ]);

        $response->assertRedirect(route('admin.promos.index'));
        $promo->refresh();

        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($promo->image);
        $this->assertNotEquals($oldPath, $promo->image);
    }

    /**
     * Test 13: Hapus gambar melalui remove_image
     */
    public function test_remove_image_clears_field_and_deletes_file(): void
    {
        $this->actingAs($this->admin);
        Storage::fake('public');

        $file = UploadedFile::fake()->image('akan_dihapus.jpg');
        $path = $file->store('promos', 'public');

        $promo = Promo::create([
            'title' => 'Promo Hapus Gambar',
            'slug' => 'promo-hapus-gambar',
            'image' => $path,
            'discount_type' => 'none',
            'is_active' => true,
        ]);

        $response = $this->put(route('admin.promos.update', $promo->id), [
            'remove_image' => 1,
        ]);

        $response->assertRedirect(route('admin.promos.index'));
        $promo->refresh();

        $this->assertNull($promo->image);
        Storage::disk('public')->assertMissing($path);
    }

    /**
     * Test 14: Validasi tanggal - end_date tidak boleh mendahului start_date
     */
    public function test_end_date_cannot_be_before_start_date(): void
    {
        $this->actingAs($this->admin);

        $promo = Promo::create([
            'title' => 'Promo Cek Tanggal',
            'slug' => 'promo-cek-tanggal',
            'discount_type' => 'none',
            'start_date' => '2026-11-10',
            'end_date' => '2026-11-20',
            'is_active' => true,
        ]);

        $response = $this->put(route('admin.promos.update', $promo->id), [
            'end_date' => '2026-11-05',
        ]);

        $response->assertSessionHasErrors(['end_date']);
    }
}
