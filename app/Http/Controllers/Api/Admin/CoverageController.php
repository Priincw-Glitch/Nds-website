<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CoverageResource;
use App\Models\ActivityLog;
use App\Models\IndonesiaDistrict;
use App\Models\IndonesiaProvince;
use App\Models\IndonesiaRegency;
use App\Models\Service;
use App\Models\ServiceCoverage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoverageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ServiceCoverage::with('service');

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->searchLocation($q);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('service_id')) {
            $query->where('service_id', (int) $request->input('service_id'));
        }

        $coverages = $query->orderBy('province')->orderBy('city')->orderBy('area_name')
            ->paginate($request->integer('per_page', 15) ?: 15);

        return response()->json([
            'data' => CoverageResource::collection($coverages->items()),
            'meta' => [
                'current_page' => $coverages->currentPage(),
                'last_page' => $coverages->lastPage(),
                'per_page' => $coverages->perPage(),
                'total' => $coverages->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $coverage = ServiceCoverage::create($data);

        ActivityLog::log('coverage_created', "Admin created coverage area via mobile: {$coverage->area_name}", $coverage);

        return response()->json([
            'message' => 'Cakupan wilayah berhasil ditambahkan.',
            'data' => new CoverageResource($coverage->load('service')),
        ], 201);
    }

    public function update(Request $request, ServiceCoverage $coverage): JsonResponse
    {
        $data = $this->validated($request);

        $coverage->update($data);

        ActivityLog::log('coverage_updated', "Admin updated coverage area via mobile: {$coverage->area_name}", $coverage);

        return response()->json([
            'message' => 'Cakupan wilayah berhasil diperbarui.',
            'data' => new CoverageResource($coverage->load('service')),
        ]);
    }

    public function destroy(ServiceCoverage $coverage): JsonResponse
    {
        ActivityLog::log('coverage_deleted', "Admin deleted coverage area via mobile: {$coverage->area_name}", $coverage);
        $coverage->delete();

        return response()->json(['message' => 'Cakupan wilayah berhasil dihapus.']);
    }

    /**
     * Referensi wilayah Indonesia untuk dropdown form (data yang sama
     * dengan endpoint JSON region pada CoverageAdminController web).
     */
    public function provinces(): JsonResponse
    {
        return response()->json([
            'data' => IndonesiaProvince::orderBy('name')->get(['code', 'name']),
        ]);
    }

    public function regencies(string $provinceCode): JsonResponse
    {
        return response()->json([
            'data' => IndonesiaRegency::where('province_code', $provinceCode)->orderBy('name')->get(['code', 'name', 'type']),
        ]);
    }

    public function districts(string $regencyCode): JsonResponse
    {
        return response()->json([
            'data' => IndonesiaDistrict::where('regency_code', $regencyCode)->orderBy('name')->get(['code', 'name']),
        ]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'area_name' => ['required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'service_name' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:available,development,unavailable'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}
