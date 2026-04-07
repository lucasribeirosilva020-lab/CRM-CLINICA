$files = @(
    'src\app\(dashboard)\configuracoes\usuarios\page.tsx',
    'src\app\(dashboard)\configuracoes\equipe\page.tsx',
    'src\app\(dashboard)\conversas\page.tsx',
    'src\app\(dashboard)\agendamentos\page.tsx',
    'src\app\(dashboard)\clientes\[status]\page.tsx',
    'src\app\signup\page.tsx',
    'src\app\login\page.tsx',
    'src\components\modals\ColunaModal.tsx',
    'src\components\modals\UsuarioModal.tsx'
)

$orderedReplacements = @(
    @('bg-slate-950', 'bg-gray-50'),
    @('bg-slate-900/50', 'bg-white/80'),
    @('bg-slate-900', 'bg-white'),
    @('border-slate-800', 'border-gray-200'),
    @('border-slate-700', 'border-gray-300'),
    @('hover:bg-slate-800', 'hover:bg-gray-100'),
    @('hover:bg-slate-900', 'hover:bg-gray-50'),
    @('bg-slate-800', 'bg-gray-100'),
    @('text-slate-900', 'text-gray-900'),
    @('text-slate-600', 'text-gray-600'),
    @('text-slate-500', 'text-gray-500'),
    @('text-slate-400', 'text-gray-400'),
    @('text-slate-300', 'text-gray-500'),
    @('text-slate-200', 'text-gray-800'),
    @('hover:text-white', 'hover:text-gray-900'),
    @('bg-black/70', 'bg-black/30'),
    @('bg-black/60', 'bg-black/30')
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path -LiteralPath $fullPath) {
        $content = Get-Content -LiteralPath $fullPath -Raw
        $changed = $false
        foreach ($pair in $orderedReplacements) {
            if ($content.Contains($pair[0])) {
                $content = $content.Replace($pair[0], $pair[1])
                $changed = $true
            }
        }
        if ($changed) {
            Set-Content -LiteralPath $fullPath -Value $content -NoNewline
            Write-Host "Fixed: $file"
        } else {
            Write-Host "Clean: $file"
        }
    } else {
        Write-Host "Not found: $file"
    }
}
Write-Host "Done!"
