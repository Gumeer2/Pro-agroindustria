<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExitOperatorType extends Model
{
    protected $table = 'exit_operator_types';

    protected $fillable = [
        'name',
    ];
}

