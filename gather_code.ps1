$outputFile = "c:\Users\ftox\Desktop\familysync\all_project_code.txt"
$sourceDir = "c:\Users\ftox\Desktop\familysync"
if (Test-Path $outputFile) { Remove-Item $outputFile }

$files = Get-ChildItem -Path $sourceDir -Recurse -File -ErrorAction SilentlyContinue | Where-Object { 
    $_.FullName -notmatch "\\node_modules\\" -and 
    $_.FullName -notmatch "\\\.git\\" -and 
    $_.FullName -notmatch "\\venv\\" -and 
    $_.FullName -notmatch "\\\.expo\\" -and 
    $_.FullName -notmatch "\\__pycache__\\" -and 
    $_.FullName -notmatch "\\assets\\" -and 
    $_.Name -notmatch "package-lock.json" -and
    $_.Name -notmatch "yarn.lock" -and
    $_.Name -notmatch "all_project_code.txt" -and
    $_.Name -notmatch "gather_code.ps1" -and
    ($_.Extension -match "\.(js|jsx|ts|tsx|py|css|html)$")
}

foreach ($file in $files) {
    if ($file.Length -gt 1000000) { continue } # skip large files
    $relativePath = $file.FullName.Substring($sourceDir.Length + 1)
    $ext = $file.Extension.ToLower()
    
    $commentStart = "//"
    $commentEnd = ""
    
    if ($ext -eq ".py") { 
        $commentStart = "#" 
    } elseif ($ext -eq ".css") { 
        $commentStart = "/*"
        $commentEnd = " */"
    } elseif ($ext -eq ".html" -or $ext -eq ".xml") { 
        $commentStart = "<!--"
        $commentEnd = " -->"
    }
    
    $header = "`r`n`r`n$commentStart =========================================$commentEnd`r`n$commentStart Module: $relativePath$commentEnd`r`n$commentStart =========================================$commentEnd`r`n"
    
    try {
        [System.IO.File]::AppendAllText($outputFile, $header)
        $content = [System.IO.File]::ReadAllText($file.FullName)
        [System.IO.File]::AppendAllText($outputFile, $content)
    } catch {
        Write-Warning "Could not read $($file.FullName)"
    }
}

Write-Output "Done! Code saved to $outputFile"
