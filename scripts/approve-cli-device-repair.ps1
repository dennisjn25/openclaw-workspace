$ErrorActionPreference = 'Stop'

for ($i = 0; $i -lt 8; $i++) {
    $raw = & openclaw.cmd devices list --json 2>$null
    if (-not $raw) {
        Start-Sleep -Milliseconds 500
        continue
    }

    $data = $raw | ConvertFrom-Json
    if (-not $data.pending -or $data.pending.Count -eq 0) {
        Write-Output '{"ok":true,"message":"no pending requests"}'
        exit 0
    }

    $req = $data.pending[0]
    $approve = & openclaw.cmd devices approve $req.requestId --json 2>&1
    $text = ($approve | Out-String)

    if ($LASTEXITCODE -eq 0) {
        Write-Output $text.Trim()
        exit 0
    }

    if ($text -match 'unknown requestId') {
        Start-Sleep -Milliseconds 500
        continue
    }

    Write-Output $text.Trim()
    exit $LASTEXITCODE
}

Write-Error 'Failed to approve a stable pending request after multiple attempts.'
