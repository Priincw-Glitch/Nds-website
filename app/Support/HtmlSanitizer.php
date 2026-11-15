<?php

namespace App\Support;

use DOMDocument;
use DOMElement;

/**
 * Sanitizer HTML untuk konten halaman statis. Editor menyimpan HTML; sebelum
 * disimpan ke database, markup dibersihkan ke allowlist tag yang benar-benar
 * dipakai editor, tanpa atribut event atau tag asing.
 */
class HtmlSanitizer
{
    /** Tag yang diizinkan beserta atribut yang boleh bertahan. */
    private const ALLOWED = [
        'p' => [],
        'h2' => [],
        'h3' => [],
        'ul' => [],
        'ol' => [],
        'li' => [],
        'strong' => [],
        'b' => [],
        'em' => [],
        'i' => [],
        'blockquote' => [],
        'br' => [],
        'hr' => [],
        'a' => ['href'],
    ];

    public static function clean(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        $document = new DOMDocument();
        libxml_use_internal_errors(true);
        // Tambahkan root ber-Encoding agar teks non-ASCII tidak berubah jadi entitas rusak.
        $document->loadHTML(
            '<?xml encoding="utf-8"?><body>' . $html . '</body>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );
        libxml_clear_errors();

        $body = $document->getElementsByTagName('body')->item(0);
        if ($body === null) {
            return null;
        }

        self::filter($body);

        $cleaned = '';
        foreach (iterator_to_array($body->childNodes) as $node) {
            $cleaned .= $document->saveHTML($node);
        }

        return trim($cleaned) === '' ? null : $cleaned;
    }

    private static function filter(\DOMNode $node): void
    {
        foreach (iterator_to_array($node->childNodes) as $child) {
            if ($child instanceof DOMElement) {
                if (!array_key_exists(strtolower($child->tagName), self::ALLOWED)) {
                    // Tag tak diizinkan: isi teksnya dipertahankan, markup dibuang.
                    $text = $child->ownerDocument->createTextNode($child->textContent);
                    $child->parentNode?->replaceChild($text, $child);
                    continue;
                }

                foreach (iterator_to_array($child->attributes) as $attribute) {
                    $name = strtolower($attribute->name);
                    $allowedAttributes = self::ALLOWED[strtolower($child->tagName)];
                    $safeHref = $name === 'href'
                        && preg_match('/^(https?:\/\/|\/|#|mailto:)/i', $attribute->value) === 1;
                    if (!in_array($name, $allowedAttributes, true) || ($name === 'href' && !$safeHref)) {
                        $child->removeAttribute($attribute->name);
                    }
                }
            }

            if ($child->hasChildNodes()) {
                self::filter($child);
            }
        }
    }
}
