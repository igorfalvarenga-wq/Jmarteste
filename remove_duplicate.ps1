$file = "c:\Users\igorf\Downloads\site de teste\index.html"
$content = Get-Content $file -Raw

# Encontrar a segunda ocorrência de "async function handleAddClient" após a primeira
$lines = $content -split "`n"
$output = @()
$addClientCount = 0

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    if ($line -like "*async function handleAddClient*") {
        $addClientCount++
        if ($addClientCount -eq 2) {
            # Pular até a próxima função
            while ($i -lt $lines.Count -and -not ($lines[$i] -like "*async function*" -or $lines[$i] -like "*function *" -and $lines[$i] -notlike "*handleAddClient*")) {
                $i++
            }
            $i-- #  Voltar um passo para pegar a próxima função
            continue
        }
    }
    
    $output += $line
}

$newContent = $output -join "`n"
Set-Content $file $newContent
Write-Host "Duplicata removida! Arquivo atualizado."
