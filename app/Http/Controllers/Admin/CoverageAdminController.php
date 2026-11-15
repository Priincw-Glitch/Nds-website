<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IndonesiaDistrict;
use App\Models\IndonesiaProvince;
use App\Models\IndonesiaRegency;
use App\Models\Service;
use App\Models\ServiceCoverage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CoverageAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ServiceCoverage::with('service');

        if ($request->filled('q')) {
            $query->searchLocation($request->input('q'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $coverages = $query->orderBy('city')->orderBy('area_name')->paginate(15)->withQueryString();

        return Inertia::render('Admin/Coverages/Index', [
            'coverages' => $coverages,
            'services'  => Service::published()->get(['id', 'name']),
            'filters'   => $request->only(['q', 'status']),
        ]);
    }

    /* ------------------------------------------------------------------
     |  Referensi wilayah Indonesia (dropdown bersambung)
     ------------------------------------------------------------------ */

    public function provinces(): JsonResponse
    {
        return response()->json(
            IndonesiaProvince::orderBy('name')->get(['code', 'name'])
        );
    }

    public function regencies(string $provinceCode): JsonResponse
    {
        abort_unless(IndonesiaProvince::where('code', $provinceCode)->exists(), 404);

        return response()->json(
            IndonesiaRegency::where('province_code', $provinceCode)
                ->orderBy('name')
                ->get(['code', 'name'])
                ->map(fn (IndonesiaRegency $regency) => [
                    'code' => $regency->code,
                    'name' => $regency->name,
                    'type' => $regency->type,
                ])
        );
    }

    public function districts(string $regencyCode): JsonResponse
    {
        abort_unless(IndonesiaRegency::where('code', $regencyCode)->exists(), 404);

        return response()->json(
            IndonesiaDistrict::where('regency_code', $regencyCode)
                ->orderBy('name')
                ->get(['code', 'name'])
        );
    }

    /* ------------------------------------------------------------------
     |  CRUD Cakupan Wilayah
     ------------------------------------------------------------------ */

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateCoverage($request);

        ServiceCoverage::create($data);

        return redirect()->route('admin.coverages.index')->with('success', 'Data cakupan wilayah berhasil ditambahkan.');
    }

    public function update(Request $request, ServiceCoverage $coverage): RedirectResponse
    {
        $data = $this->validateCoverage($request);

        // Status aktif hanya diubah bila dikirim, agar data lama tidak ikut aktif kembali.
        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        } else {
            unset($data['is_active']);
        }

        $coverage->update($data);

        return redirect()->route('admin.coverages.index')->with('success', 'Data cakupan wilayah berhasil diperbarui.');
    }

    public function destroy(ServiceCoverage $coverage): RedirectResponse
    {
        $coverage->delete();

        return redirect()->route('admin.coverages.index')->with('success', 'Data cakupan wilayah berhasil dihapus.');
    }

    /**
     * Validasi form + relasi wilayah. Nama provinsi/kota/kecamatan diambil
     * dari tabel referensi (otoritatif) — tidak dipercaya dari frontend —
     * sehingga kolom nama lama tetap terisi dan pencarian LIKE di Cek
     * Jangkauan publik tetap bekerja.
     */
    private function validateCoverage(Request $request): array
    {
        $data = $request->validate([
            'area_name'     => 'required|string|max:255',
            'province_code' => 'required|digits:2|exists:indonesia_provinces,code',
            'regency_code'  => 'required|digits:4|exists:indonesia_regencies,code',
            'district_code' => 'required|digits:6|exists:indonesia_districts,code',
            'service_id'    => 'nullable|exists:services,id',
            'service_name'  => 'nullable|string|max:255',
            'status'        => 'required|in:available,development,unavailable',
            'notes'         => 'nullable|string|max:1000',
            'is_active'     => 'boolean',
        ]);

        $regency  = IndonesiaRegency::find($data['regency_code']);
        $district = IndonesiaDistrict::find($data['district_code']);

        // Relasi wilayah divalidasi di backend: kecamatan harus milik
        // kota/kabupaten yang dipilih, kota/kabupaten milik provinsinya.
        if ($regency->province_code !== $data['province_code']) {
            throw ValidationException::withMessages([
                'regency_code' => 'Kota/Kabupaten yang dipilih tidak berada di provinsi tersebut.',
            ]);
        }
        if ($district->regency_code !== $data['regency_code']) {
            throw ValidationException::withMessages([
                'district_code' => 'Kecamatan yang dipilih tidak berada di kota/kabupaten tersebut.',
            ]);
        }

        $data['province'] = IndonesiaProvince::find($data['province_code'])->name;
        $data['city']     = $regency->name;
        $data['district'] = $district->name;

        // Jika service_id dipilih dan service_name kosong, otomatis isi nama service
        if (!empty($data['service_id']) && empty($data['service_name'])) {
            $service = Service::find($data['service_id']);
            if ($service) {
                $data['service_name'] = $service->name;
            }
        }

        return $data;
    }
}
