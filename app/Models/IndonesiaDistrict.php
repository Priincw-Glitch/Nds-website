<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IndonesiaDistrict extends Model
{
    public $incrementing = false;
    protected $primaryKey = 'code';
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['code', 'regency_code', 'name'];

    public function regency(): BelongsTo
    {
        return $this->belongsTo(IndonesiaRegency::class, 'regency_code', 'code');
    }
}
