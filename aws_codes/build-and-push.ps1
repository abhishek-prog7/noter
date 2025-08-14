Param(
    [string]$AwsProfile = "admin",
    [string]$Region = $null,
    [string]$RepositoryNamespace = "noter",  # Optional ECR namespace/prefix, e.g. "noter"
    [string]$Tag = $(Get-Date -Format "yyyyMMddHHmmss")
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERROR] $msg" -ForegroundColor Red }

try {
    if (-not $Region -or $Region.Trim() -eq "") {
        Write-Info "Resolving AWS region from profile '$AwsProfile'..."
        $Region = (& aws configure get region --no-cli-pager --profile $AwsProfile).Trim()
        if (-not $Region) { throw "Could not determine AWS region from profile '$AwsProfile'. Pass -Region explicitly." }
    }

    Write-Info "Using AWS profile: $AwsProfile"
    Write-Info "Using AWS region:  $Region"

    Write-Info "Fetching AWS Account ID..."
    $AccountId = (& aws sts get-caller-identity --no-cli-pager --query Account --output text --profile $AwsProfile).Trim()
    if (-not $AccountId) { throw "Unable to determine AWS Account ID for profile '$AwsProfile'" }
    Write-Info "Account ID: $AccountId"

    $Registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"

    Write-Info "Logging in to ECR registry $Registry ..."
    & aws ecr get-login-password --no-cli-pager --region $Region --profile $AwsProfile | docker login --username AWS --password-stdin $Registry | Out-Null

    # Force classic Docker builder (schema2 manifests) to avoid OCI media types unsupported by Lambda
    Write-Warn "Disabling Docker BuildKit and avoiding buildx to produce Docker schema2 images for Lambda compatibility."
    $env:DOCKER_BUILDKIT = "0"

    # Find all immediate subdirectories with a Dockerfile
    $root = Split-Path -Parent $MyInvocation.MyCommand.Path
    Set-Location $root
    $projects = Get-ChildItem -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'Dockerfile') }

    if (-not $projects -or $projects.Count -eq 0) {
        Write-Err "No subfolders with a Dockerfile were found under '$root'."
        exit 1
    }

    foreach ($proj in $projects) {
        $name = $proj.Name
        $repoNameRaw = if ([string]::IsNullOrWhiteSpace($RepositoryNamespace)) { $name } else { "$RepositoryNamespace/$name" }
        # ECR repository names must be lowercase and match AWS regex. Sanitize:
        $repoName = ($repoNameRaw.ToLower() -replace "[^a-z0-9/_\.-]", "-")
        $repoName = ($repoName -replace "-{2,}", "-").Trim('-', '/', '.')
        # Use sanitized repo name for local tag to satisfy Docker's lowercase requirement
        $localTag = "${repoName}:latest"
        $remoteTag = "${Registry}/${repoName}:${Tag}"
        $remoteLatest = "${Registry}/${repoName}:latest"
        Write-Host "`n============================================================" -ForegroundColor DarkGray
        Write-Info "Processing project: $name"
        Write-Info "ECR repository:   $repoName"
        Write-Info "Tags:             $remoteTag and latest"

        # Create ECR repository if it doesn't exist
        try {
            $null = & aws ecr describe-repositories --no-cli-pager --repository-names $repoName --region $Region --profile $AwsProfile | Out-Null
            $repoExists = ($LASTEXITCODE -eq 0)
        } catch {
            $repoExists = $false
            Write-Warn "Describe-repositories reported an error; assuming repo missing. Details: $($_.Exception.Message)"
        }
        if (-not $repoExists) {
            Write-Info "Creating ECR repository $repoName ..."
            try {
                & aws ecr create-repository `
                    --no-cli-pager `
                    --repository-name $repoName `
                    --image-scanning-configuration scanOnPush=true `
                    --region $Region `
                    --profile $AwsProfile | Out-Null
                if ($LASTEXITCODE -ne 0) { throw "Non-zero exit creating ECR repository $repoName." }
            } catch {
                throw "Failed to create ECR repository $repoName. Error: $($_.Exception.Message)"
            }
        } else {
            Write-Info "ECR repository $repoName already exists."
        }

        # Build image using classic docker build (no buildx) for Lambda compatibility
        Write-Info "Building Docker image for $name (classic builder) ..."
        docker build -t $localTag $proj.FullName

        if ($LASTEXITCODE -ne 0) { throw "Docker build failed for $name" }

        # Tag images
        Write-Info "Tagging image as $remoteTag and $remoteLatest ..."
        docker tag $localTag $remoteTag
        docker tag $localTag $remoteLatest

        # Push images
        Write-Info "Pushing $remoteTag ..."
        docker push $remoteTag
        if ($LASTEXITCODE -ne 0) { throw "Failed to push $remoteTag" }

        Write-Info "Pushing $remoteLatest ..."
        docker push $remoteLatest
        if ($LASTEXITCODE -ne 0) { throw "Failed to push $remoteLatest" }

        Write-Info "Done: $name"
    }

    Write-Host "`nAll images built and pushed successfully." -ForegroundColor Green

} catch {
    Write-Err $_
    exit 1
}
