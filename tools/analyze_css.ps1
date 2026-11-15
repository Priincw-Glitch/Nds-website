$p = 'D:\laragon\www\NDS-WEBSITE\public\build\assets\app-rU_r3goC.css'
$raw = Get-Content $p -Raw
Write-Host '=== BUILD CSS ANALYSIS ==='
Write-Host ("overflow-x:hidden count : " + ([regex]::Matches($raw,'overflow-x:hidden').Count))
Write-Host ("100vw count             : " + ([regex]::Matches($raw,'100vw').Count))
Write-Host ("position:fixed count    : " + ([regex]::Matches($raw,'position:fixed').Count))
Write-Host ("min-width: count        : " + ([regex]::Matches($raw,'min-width:').Count))
Write-Host '=== overflow-x:hidden CONTEXT (first 4) ==='
$cnt=0
for($i=0; ($i=$raw.IndexOf('overflow-x:hidden',$i)) -ge 0; $i++){
  $cnt++
  if($cnt -gt 4){break}
  $a=[math]::Max(0,$i-120)
  $len=[math]::Min(260,$raw.Length-$a)
  Write-Output ($raw.Substring($a,$len) + ' <<<END>>>')
}
Write-Host '=== 100vw CONTEXT (first 6) ==='
$cnt=0
for($i=0; ($i=$raw.IndexOf('100vw',$i)) -ge 0; $i++){
  $cnt++
  if($cnt -gt 6){break}
  $a=[math]::Max(0,$i-90)
  $len=[math]::Min(200,$raw.Length-$a)
  Write-Output ($raw.Substring($a,$len) + ' <<<END>>>')
}
