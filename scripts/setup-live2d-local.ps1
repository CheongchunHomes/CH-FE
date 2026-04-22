param(
  [Parameter(Mandatory = $true)]
  [string]$SdkRoot,

  [string]$ModelName = "roboko",

  [string]$ProjectRoot = ""
)

$ErrorActionPreference = "Stop"

$scriptRoot = if ($PSScriptRoot) {
  $PSScriptRoot
} else {
  Split-Path -Parent $MyInvocation.MyCommand.Path
}

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = Join-Path $scriptRoot ".."
}

$SdkRoot = (Resolve-Path -LiteralPath $SdkRoot).Path
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path

function Copy-Tree {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Destination
  )

  if (-not (Test-Path -LiteralPath $Source)) {
    throw "Missing source folder: $Source"
  }

  if (Test-Path -LiteralPath $Destination) {
    Remove-Item -LiteralPath $Destination -Recurse -Force
  }

  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
  Copy-Item -Path (Join-Path $Source "*") -Destination $Destination -Recurse -Force
}

function Copy-TemplateTree {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Destination
  )

  if (-not (Test-Path -LiteralPath $Source)) {
    throw "Missing template folder: $Source"
  }

  Get-ChildItem -LiteralPath $Source -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($Source.Length).TrimStart("\", "/")
    $relative = $relative -replace "\.template$", ""
    $target = Join-Path $Destination $relative
    $targetDir = Split-Path -Parent $target

    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $target -Force
  }
}

function Find-FirstExistingPath {
  param([string[]]$Candidates)

  foreach ($candidate in $Candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  return $null
}

function Patch-LAppDefine {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [string]$ModelName
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing lappdefine.ts: $Path"
  }

  $content = Get-Content -LiteralPath $Path -Raw
  $content = $content -replace "export const ResourcesPath = '[^']*';", "export const ResourcesPath = '/live2d/Resources/';"
  $content = $content -replace "export const ShaderPath = '[^']*';", "export const ShaderPath = '/live2d/Framework/Shaders/WebGL/';"
  $content = [regex]::Replace(
    $content,
    "export const ModelDir: string\[\] = \[[\s\S]*?\];",
    "export const ModelDir: string[] = ['$ModelName'];"
  )

  Set-Content -LiteralPath $Path -Value $content -Encoding UTF8
}

function Patch-LAppView {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing lappview.ts: $Path"
  }

  $content = Get-Content -LiteralPath $Path -Raw
  $content = $content -replace "this\._gear\.release\(\);\s*this\._gear = null;", "if (this._gear) {`r`n      this._gear.release();`r`n      this._gear = null;`r`n    }"
  $content = $content -replace "this\._back\.release\(\);\s*this\._back = null;", "if (this._back) {`r`n      this._back.release();`r`n      this._back = null;`r`n    }"
  $content = $content -replace "if \(this\._gear\.isHit\(posX, posY\)\)", "if (this._gear && this._gear.isHit(posX, posY))"

  Set-Content -LiteralPath $Path -Value $content -Encoding UTF8
}

function Patch-LAppModel {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing lappmodel.ts: $Path"
  }

  $content = Get-Content -LiteralPath $Path -Raw
  $content = $content -replace "this\._modelMatrix\.setupFromLayout\(layout\);", "this._modelMatrix.setupFromLayout(layout);`r`n      this._modelMatrix.setWidth(0.72);"
  $content = $content -replace "this\._modelMatrix\.translateRelative\(0\.3, 0\.0\);", "this._modelMatrix.translateRelative(0.0, 0.0);"
  $content = $content -replace "this\._modelMatrix\.translateRelative\(0\.0, 0\.0\);", "this._modelMatrix.translateRelative(0.0, 0.0);"

  Set-Content -LiteralPath $Path -Value $content -Encoding UTF8
}

function Ensure-OpenAIConfig {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (Test-Path -LiteralPath $Path) {
    return
  }

  $parent = Split-Path -Parent $Path
  New-Item -ItemType Directory -Path $parent -Force | Out-Null
  @'
{
  "apiKey": ""
}
'@ | Set-Content -LiteralPath $Path -Encoding UTF8
}

$frameworkSource = Join-Path $SdkRoot "Framework"
$coreSource = Join-Path $SdkRoot "Core"
$demoSource = Join-Path $SdkRoot "Samples\TypeScript\Demo\src"
$shaderSource = Join-Path $SdkRoot "Framework\Shaders"
$templateSource = Join-Path $ProjectRoot "templates\live2d"
$modelSource = Find-FirstExistingPath @(
  (Join-Path $SdkRoot "Samples\Resources\$ModelName"),
  (Join-Path $SdkRoot "Samples\TypeScript\Demo\public\Resources\$ModelName")
)

Write-Host "SDK root    : $SdkRoot"
Write-Host "Project root: $ProjectRoot"
Write-Host "Model       : $ModelName"
Write-Host ""

Copy-Tree -Source $frameworkSource -Destination (Join-Path $ProjectRoot "lib/live2d-sdk/Framework")
Copy-Tree -Source $coreSource -Destination (Join-Path $ProjectRoot "public/live2d/Core")
Copy-Tree -Source $demoSource -Destination (Join-Path $ProjectRoot "lib/live2d-sdk/Demo/src")
Copy-Tree -Source $shaderSource -Destination (Join-Path $ProjectRoot "public/live2d/Framework/Shaders")
Copy-TemplateTree -Source $templateSource -Destination $ProjectRoot
Patch-LAppDefine -Path (Join-Path $ProjectRoot "lib/live2d-sdk/Demo/src/lappdefine.ts") -ModelName $ModelName
Patch-LAppView -Path (Join-Path $ProjectRoot "lib/live2d-sdk/Demo/src/lappview.ts")
Patch-LAppModel -Path (Join-Path $ProjectRoot "lib/live2d-sdk/Demo/src/lappmodel.ts")
Ensure-OpenAIConfig -Path (Join-Path $ProjectRoot "config/openai.json")

if ($null -eq $modelSource) {
  throw "Could not find model '$ModelName' under the SDK package."
}

Copy-Tree -Source $modelSource -Destination (Join-Path $ProjectRoot "public/live2d/Resources/$ModelName")

Write-Host ""
Write-Host "Live2D local files were copied. These paths are ignored by Git."
