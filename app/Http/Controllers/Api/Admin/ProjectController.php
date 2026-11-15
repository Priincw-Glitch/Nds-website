<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Models\ActivityLog;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Manajemen portofolio proyek (tabel projects) via API mobile.
 */
class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Project::query();

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(fn ($builder) => $builder
                ->where('title', 'like', "%{$q}%")
                ->orWhere('client', 'like', "%{$q}%"));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $projects = $query->orderBy('sort_order')->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15) ?: 15);

        return response()->json([
            'data' => ProjectResource::collection($projects->items()),
            'meta' => [
                'current_page' => $projects->currentPage(),
                'last_page' => $projects->lastPage(),
                'per_page' => $projects->perPage(),
                'total' => $projects->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $data['slug'] = $this->uniqueSlug($data['title']);
        $data['is_published'] = $request->boolean('is_published');
        $data['sort_order'] = $data['sort_order'] ?? 0;

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = $request->file('thumbnail')->store('projects', 'public');
        }

        $project = Project::create($data);

        ActivityLog::log('project_created', "Admin created project via mobile: {$project->title}", $project);

        return response()->json([
            'message' => 'Proyek portofolio berhasil ditambahkan.',
            'data' => new ProjectResource($project),
        ], 201);
    }

    public function show(Project $project): JsonResponse
    {
        return response()->json(['data' => new ProjectResource($project)]);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $data = $this->validated($request);

        // Slug tidak berubah agar URL portofolio tetap stabil.
        $data['is_published'] = $request->boolean('is_published');
        $data['sort_order'] = $data['sort_order'] ?? $project->sort_order;

        if ($request->hasFile('thumbnail')) {
            if ($project->thumbnail) {
                Storage::disk('public')->delete($project->thumbnail);
            }
            $data['thumbnail'] = $request->file('thumbnail')->store('projects', 'public');
        } elseif ($request->boolean('remove_thumbnail')) {
            if ($project->thumbnail) {
                Storage::disk('public')->delete($project->thumbnail);
            }
            $data['thumbnail'] = null;
        } else {
            unset($data['thumbnail']);
        }

        unset($data['remove_thumbnail']);

        $project->update($data);

        ActivityLog::log('project_updated', "Admin updated project via mobile: {$project->title}", $project);

        return response()->json([
            'message' => 'Proyek portofolio berhasil diperbarui.',
            'data' => new ProjectResource($project),
        ]);
    }

    public function destroy(Project $project): JsonResponse
    {
        if ($project->thumbnail) {
            Storage::disk('public')->delete($project->thumbnail);
        }

        ActivityLog::log('project_deleted', "Admin deleted project via mobile: {$project->title}", $project);
        $project->delete();

        return response()->json(['message' => 'Proyek portofolio berhasil dihapus.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'client' => ['nullable', 'string', 'max:255'],
            'thumbnail' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_published' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'proyek';
        $slug = $base;
        $suffix = 2;

        while (Project::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
