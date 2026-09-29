Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\juan.villegas\.gemini\antigravity\brain\db554fa8-e5c0-489c-a2e8-b5341143505d\media__1770997900716.png"
$destPath = "c:\xampp\htdocs\vecode\public\images\cursor.png"

Write-Host "Source: $sourcePath"
Write-Host "Dest: $destPath"

try {
    $img = [System.Drawing.Image]::FromFile($sourcePath)
    $resized = new-object System.Drawing.Bitmap(32, 32)
    $graph = [System.Drawing.Graphics]::FromImage($resized)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.DrawImage($img, 0, 0, 32, 32)
    $resized.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $img.Dispose()
    $resized.Dispose()
    $graph.Dispose()

    Write-Host "Success: Resized to 32x32"
} catch {
    Write-Error "Failed to resize: $_"
}
