<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Page;
use App\Models\Project;
use App\Models\Promo;
use App\Models\Service;
use App\Models\ServiceCoverage;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $data = Cache::remember('home_data', 300, fn () => [
            'services' => Service::published()
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'icon', 'image', 'short_description', 'layout_size']),
            'promos' => Promo::active()->with('category')->showOnHome()->orderByDesc('is_featured')->orderBy('sort_order', 'asc')->orderByDesc('start_date')->limit(4)->get(['id', 'title', 'slug', 'description', 'image', 'service_category_id', 'discount_type', 'original_price', 'discount_percentage', 'discount_amount', 'final_price', 'start_date', 'end_date', 'cta_text', 'cta_url', 'is_featured', 'show_on_home', 'sort_order']),
            'articles' => Article::published()->with('category')->orderByDesc('published_at')->limit(3)->get(),
            // Portofolio hanya tayang di beranda (tanpa halaman publik sendiri);
            // admin mengatur urutan & status publish dari Admin Panel.
            'projects' => Project::published()->orderBy('sort_order')->limit(6)
                ->get(['id', 'title', 'slug', 'category', 'description', 'thumbnail', 'client', 'sort_order']),
        ]);

        // Opsi "jenis layanan" pada Cek Jangkauan berasal dari data cakupan yang
        // dikelola Admin, bukan daftar tetap di komponen. Tanpa data cakupan,
        // pakai nama layanan yang tayang agar pilihan tetap relevan.
        $coverageServices = ServiceCoverage::active()
            ->whereNotNull('service_name')
            ->where('service_name', '!=', '')
            ->distinct()
            ->orderBy('service_name')
            ->pluck('service_name');

        if ($coverageServices->isEmpty()) {
            $coverageServices = Service::published()->orderBy('sort_order')->pluck('name');
        }

        $settings = $this->settings();

        return Inertia::render('Home', [
            'services' => $data['services'],
            'promos' => $data['promos'],
            'articles' => $data['articles'],
            'projects' => $data['projects'],
            'coverageServices' => $coverageServices->values(),
            'settings' => $settings,
        ]);
    }

    public function about(): Response
    {
        return Inertia::render('About', [
            'page' => $this->pageFor(Page::SLUG_ABOUT),
            'settings' => $this->settings(),
            // Bidang keahlian pada halaman Tentang Kami memakai data layanan
            // yang sama dengan katalog publik dan Admin Panel.
            'services' => Service::published()
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'icon', 'image', 'short_description', 'sort_order']),
        ]);
    }

    public function privacy(): Response
    {
        return Inertia::render('Privacy', [
            'page' => $this->pageFor(Page::SLUG_PRIVACY),
            'settings' => $this->settings(),
        ]);
    }

    /**
     * Konten halaman statis dari Admin Panel. Halaman yang dinonaktifkan admin
     * tidak lagi dapat diakses publik.
     */
    private function pageFor(string $slug): ?array
    {
        $page = Page::findBySlug($slug);

        if ($page && ! $page->is_published) {
            abort(404);
        }

        return $page?->only([
            'slug', 'title', 'hero_title', 'hero_description', 'content', 'image', 'updated_at',
        ]);
    }
}
