$raw = Get-Content -Path "questions.js" -Raw -Encoding UTF8
Write-Output "File loaded successfully. Size: $($raw.Length) chars"

$matches = [regex]::Matches($raw, 'id:\s*"[ESTJ0-9]+"')
Write-Output "Total questions count: $($matches.Count) (Expected: 40)"

$dimensions = @('EI', 'SN', 'TF', 'JP')
foreach ($dim in $dimensions) {
    $dimMatches = [regex]::Matches($raw, 'dimension:\s*"' + $dim + '"')
    Write-Output "Dimension $dim count: $($dimMatches.Count) (Expected: 10)"
}

$types = @('ESTJ','ESTP','ESFJ','ESFP','ENTJ','ENTP','ENFJ','ENFP','ISTJ','ISTP','ISFJ','ISFP','INTJ','INTP','INFJ','INFP')
$missing = @()
foreach ($t in $types) {
    if (-not ($raw -match ('"' + $t + '":'))) {
        $missing += $t
    }
}

if ($missing.Count -eq 0) {
    Write-Output "All 16 MBTI profiles verified!"
} else {
    Write-Output "Missing profiles: $($missing -join ', ')"
}

$html = Get-Content -Path "index.html" -Raw -Encoding UTF8
$requiredIds = @(
    'start-screen', 'quiz-screen', 'loading-screen', 'result-screen',
    'btn-mode-quick', 'btn-mode-full', 'btn-prev', 'btn-restart', 'btn-share', 'theme-toggle',
    'quiz-mode-badge', 'progress-percent', 'progress-bar', 'question-number', 'question-text',
    'result-type', 'result-title', 'result-badge', 'result-tags',
    'result-summary', 'result-descriptions', 'radar-chart-container',
    'dimension-bars-container', 'toast-message'
)

$missingIds = @()
foreach ($item in $requiredIds) {
    if (-not ($html -match ('id="' + $item + '"'))) {
        $missingIds += $item
    }
}

if ($missingIds.Count -eq 0) {
    Write-Output "All 24 required DOM element IDs are present in index.html!"
} else {
    Write-Output "Missing IDs: $($missingIds -join ', ')"
}

$forbidden = [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::UTF8.GetBytes("6각형 능력치 밸런스"))
if ($html.Contains($forbidden)) {
    Write-Output "Found forbidden phrase"
} else {
    Write-Output "Forbidden phrase successfully removed."
}
