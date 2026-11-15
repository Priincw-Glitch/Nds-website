<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndonesiaProvince extends Model
{
    public $incrementing = false;
    protected $primaryKey = 'code';
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['code', 'name'];

    public function regencies()
    {
        return $this->hasMany(IndonesiaRegency::class, 'province_code', 'code');
    }
}
