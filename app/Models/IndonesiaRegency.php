<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IndonesiaRegency extends Model
{
    public $incrementing = false;
    protected $primaryKey = 'code';
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['code', 'province_code', 'name'];

    public function province(): BelongsTo
    {
        return $this->belongsTo(IndonesiaProvince::class, 'province_code', 'code');
    }

    public function districts()
    {
        return $this->hasMany(IndonesiaDistrict::class, 'regency_code', 'code');
    }

    /** "Kota X" → kota; "Kabupaten X" / lainnya → kabupaten. */
    public function getTypeAttribute(): string
    {
        return str_starts_with($this->name, 'Kota ') ? 'kota' : 'kabupaten';
    }
}
