$p = 'D:\laragon\www\NDS-WEBSITE\public\build\assets\app-rU_r3goC.css'
$raw = Get-Content $p -Raw
Write-Host '=== BUILD CSS ANALYSIS ==='
Write-Host ("overflow-x:hidden count : " + ([regex]::Matches($raw,'overflow-x:hidden').Count))
Write-Host ("100vw count             : " + ([regex]::Matches($raw,'100vw').Count))
Write-Host ("min-width:100vw count   : " + ([regex]::Matches($raw,'min-width:100vw').Count))
Write-Host ("position:fixed count    : " + ([regex]::Matches($raw,'position:fixed').Count))
Write-Host ("width:100vw count       : " + ([regex]::Matches($raw,'width:100vw').Count))
Write-Host '=== min-width VALUES (unique) ==='
[regex]::Matches($raw,'min-width:[^;\s}]+') | ForEach-Object { $_.Value } | Sort-Object -Unique | ForEach-Object { Write-Output $_ }
Write-Host '=== width:100vw CONTEXT ==='
[regex]::Matches($raw,'[\w-]+{[^}]*?width:100vw[^}]*}') | ForEach-Object { $_.Value } | Sort-Object -Unique | ForEach-Object { Write-Output $_ }
