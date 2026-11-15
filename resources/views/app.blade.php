<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('images/logo.png') }}">
        <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('images/logo.png') }}">
        <link rel="shortcut icon" href="{{ asset('images/logo.png') }}">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="app-base" content="{{ rtrim(url('/'), '/') }}">
        @routes
        @vite('resources/js/app.tsx')
        @inertiaHead
    </head>
    <body class="antialiased">
        @inertia

        {{-- Widget live chat dimuat dari frontend (Components/TawkWidget.tsx) memakai
             property & widget ID yang dikelola di Pengaturan Situs > Integrasi. --}}
    </body>
</html>
