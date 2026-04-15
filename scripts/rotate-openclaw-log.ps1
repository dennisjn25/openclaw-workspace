param(
    [string]$LogDir = 'C:\tmp\openclaw',
    [UInt64]$MaxFileBytes = 524288000,
    [double]$ThresholdRatio = 0.75,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $LogDir)) {
    Write-Output "Log directory not found: $LogDir"
    exit 0
}

$thresholdBytes = [UInt64][math]::Floor($MaxFileBytes * $ThresholdRatio)
$archiveDir = Join-Path $LogDir 'archive'

if (-not (Test-Path -LiteralPath $archiveDir)) {
    if ($DryRun) {
        Write-Output "DRY_RUN Would create archive directory: $archiveDir"
    }
    else {
        New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
    }
}

$logFiles = Get-ChildItem -LiteralPath $LogDir -Filter 'openclaw-*.log' -File | Sort-Object LastWriteTime

if (-not $logFiles) {
    Write-Output "No OpenClaw log files found in $LogDir"
    exit 0
}

$rotated = @()

foreach ($file in $logFiles) {
    if ([UInt64]$file.Length -lt $thresholdBytes) {
        continue
    }

    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $archiveName = '{0}.{1}.log' -f $file.BaseName, $timestamp
    $archivePath = Join-Path $archiveDir $archiveName
    $sizeBefore = [UInt64]$file.Length

    if ($DryRun) {
        Write-Output ("DRY_RUN Would archive {0} ({1} bytes) to {2} and truncate original file" -f $file.FullName, $sizeBefore, $archivePath)
        continue
    }

    Copy-Item -LiteralPath $file.FullName -Destination $archivePath -Force

    $stream = [System.IO.File]::Open($file.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
    try {
        $stream.SetLength(0)
    }
    finally {
        $stream.Dispose()
    }

    $rotated += [pscustomobject]@{
        File = $file.FullName
        Archive = $archivePath
        BytesBefore = $sizeBefore
        ThresholdBytes = $thresholdBytes
        RotatedAt = (Get-Date).ToString('o')
    }
}

if ($DryRun) {
    if (-not ($logFiles | Where-Object { [UInt64]$_.Length -ge $thresholdBytes })) {
        Write-Output ("DRY_RUN No log files are at or above {0} bytes" -f $thresholdBytes)
    }
    exit 0
}

if ($rotated.Count -eq 0) {
    Write-Output ("No log files needed rotation. Threshold: {0} bytes" -f $thresholdBytes)
    exit 0
}

$rotated | ConvertTo-Json -Depth 3 -Compress
