Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\juan.villegas\.gemini\antigravity\brain\db554fa8-e5c0-489c-a2e8-b5341143505d\media__1770997900716.png"
$destNormal = "c:\xampp\htdocs\vecode\public\images\cursor.png"
$destWhite = "c:\xampp\htdocs\vecode\public\images\cursor-white.png"

function Resize-Image {
    param([string]$src, [string]$dest, [bool]$makeWhite)
    
    try {
        $img = [System.Drawing.Image]::FromFile($src)
        $resized = new-object System.Drawing.Bitmap(48, 48)
        $graph = [System.Drawing.Graphics]::FromImage($resized)
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graph.DrawImage($img, 0, 0, 48, 48)
        
        if ($makeWhite) {
            for ($x = 0; $x -lt $resized.Width; $x++) {
                for ($y = 0; $y -lt $resized.Height; $y++) {
                    $pixel = $resized.GetPixel($x, $y)
                    if ($pixel.A -gt 0) {
                        $resized.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($pixel.A, 255, 255, 255))
                    }
                }
            }
        }

        $resized.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $img.Dispose()
        $resized.Dispose()
        $graph.Dispose()
        Write-Host "Created: $dest"
    }
    catch {
        Write-Error "Error processing $dest : $_"
    }
}

Resize-Image -src $sourcePath -dest $destNormal -makeWhite $false
Resize-Image -src $sourcePath -dest $destWhite -makeWhite $true
