<?php

namespace Tests\Feature;

use App\Models\IndonesiaDistrict;
use App\Models\IndonesiaProvince;
use App\Models\IndonesiaRegency;
use App\Models\ServiceCoverage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoverageCheckTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Referensi wilayah (migrasi 2026_11_07): form admin memilih
        // provinsi/kota/kecamatan dari tabel ini, bukan mengetik nama bebas.
        IndonesiaProvince::create(['code' => '31', 'name' => 'DKI Jakarta']);
        IndonesiaRegency::create(['code' => '3171', 'province_code' => '31', 'name' => 'Kota Jakarta Selatan']);
        IndonesiaDistrict::create(['code' => '317101', 'regency_code' => '3171', 'name' => 'Kebayoran Baru']);

        IndonesiaProvince::create(['code' => '36', 'name' => 'Banten']);
        IndonesiaRegency::create(['code' => '3674', 'province_code' => '36', 'name' => 'Kota Tangerang Selatan']);
        IndonesiaDistrict::create(['code' => '367401', 'regency_code' => '3674', 'name' => 'Serpong']);

        IndonesiaProvince::create(['code' => '32', 'name' => 'Jawa Barat']);
        IndonesiaRegency::create(['code' => '3275', 'province_code' => '32', 'name' => 'Kota Bekasi']);
        IndonesiaDistrict::create(['code' => '327501', 'regency_code' => '3275', 'name' => 'Bekasi Timur']);

        ServiceCoverage::create([
            'area_name'    => 'SCBD & Sudirman',
            'city'         => 'Jakarta Selatan',
            'district'     => 'Kebayoran Baru',
            'province'     => 'DKI Jakarta',
            'service_name' => 'Semua Layanan NDS',
            'status'       => 'available',
            'notes'        => 'Infrastruktur fiber optic dedicated.',
            'is_active'    => true,
        ]);

        ServiceCoverage::create([
            'area_name'    => 'BSD City',
            'city'         => 'Tangerang Selatan',
            'district'     => 'Serpong',
            'province'     => 'Banten',
            'service_name' => 'Internet dan Jaringan',
            'status'       => 'development',
            'notes'        => 'Ekspansi jaringan fiber optic.',
            'is_active'    => true,
        ]);
    }

    public function test_homepage_loads_successfully()
    {
        $response = $this->get('/');
        $response->assertStatus(200);
    }

    public function test_coverage_check_returns_available_for_verified_location()
    {
        $response = $this->postJson('/coverage/check', [
            'location' => 'SCBD',
            'service'  => 'Internet dan Jaringan',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'found'       => true,
            'status'      => 'available',
            'is_verified' => true,
        ]);
    }

    public function test_coverage_check_returns_development_for_expanding_location()
    {
        $response = $this->postJson('/coverage/check', [
            'location' => 'BSD',
            'service'  => 'Internet dan Jaringan',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'found'       => true,
            'status'      => 'development',
            'is_verified' => true,
        ]);
    }

    public function test_coverage_check_returns_unverified_for_unknown_location()
    {
        $response = $this->postJson('/coverage/check', [
            'location' => 'Daerah Fiktif 12345',
            'service'  => 'Internet dan Jaringan',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'found'       => false,
            'status'      => 'unverified',
            'is_verified' => false,
        ]);
    }

    public function test_admin_can_view_and_manage_coverages()
    {
        // Route admin dilindungi middleware admin (role harus 'admin').
        $admin = \App\Models\User::factory()->create(['role' => 'admin', 'status' => 'active']);

        // Admin can list coverages
        $response = $this->actingAs($admin)->get('/admin/coverages');
        $response->assertStatus(200);

        // Admin can create a new coverage; wilayah wajib memakai kode referensi.
        $storeResponse = $this->actingAs($admin)->post('/admin/coverages', [
            'area_name'     => 'Kawasan Industri Jababeka',
            'province_code' => '32',
            'regency_code'  => '3275',
            'district_code' => '327501',
            'status'        => 'available',
            'notes'         => 'Infrastruktur siap sambung.',
            'is_active'     => true,
        ]);
        $storeResponse->assertRedirect('/admin/coverages');

        $this->assertDatabaseHas('service_coverages', [
            'area_name' => 'Kawasan Industri Jababeka',
            'province'  => 'Jawa Barat',
            'city'      => 'Kota Bekasi',
            'district'  => 'Bekasi Timur',
            'status'    => 'available',
        ]);
    }

    public function test_admin_cannot_save_coverage_with_mismatched_region()
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin', 'status' => 'active']);

        // Kecamatan Serpong milik Kota Tangerang Selatan, bukan Kota Bekasi.
        $response = $this->actingAs($admin)->post('/admin/coverages', [
            'area_name'     => 'Area Salah Wilayah',
            'province_code' => '32',
            'regency_code'  => '3275',
            'district_code' => '367401',
            'status'        => 'available',
            'is_active'     => true,
        ]);

        $response->assertSessionHasErrors('district_code');
        $this->assertDatabaseMissing('service_coverages', ['area_name' => 'Area Salah Wilayah']);
    }
}
