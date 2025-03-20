# GitHub Repository Info Action

This GitHub Action retrieves information about a repository, including its latest release, tags, and project details. It
is useful for workflows that need metadata about the repository.

## 🚀 Features

- Fetches the latest release information (ID, name, tag, date).
- Retrieves the latest and previous Git tags.
- Detects if the repository is a monorepo.
- Scans for projects within the repository and determines if they are Docker apps or NPM packages.
- Outputs repository details for use in GitHub Actions workflows.

## 📌 Inputs

| Name           | Description                                  | Required | Default                               |
|----------------|----------------------------------------------|----------|---------------------------------------|
| `token`        | GitHub token for authentication              | ✅ Yes    | -                                     |
| `rootDir`      | Root directory to scan                       | ❌ No     | `GITHUB_WORKSPACE` or `process.cwd()` |
| `print-output` | Whether to print repository info in the logs | ❌ No     | `true`                                |

## 📤 Outputs

| Name             | Description                                         |
|------------------|-----------------------------------------------------|
| `environment`    | Detected environment (`unknown` if not determined)  |
| `monorepo`       | Whether the repository is a monorepo (`true/false`) |
| `lastTag`        | Latest Git tag                                      |
| `lastTagSha`     | SHA of the latest Git tag                           |
| `prevTag`        | Previous Git tag                                    |
| `prevTagSha`     | SHA of the previous Git tag                         |
| `releaseId`      | ID of the latest release                            |
| `releaseName`    | Name of the latest release                          |
| `releaseTag`     | Tag of the latest release                           |
| `releaseDate`    | Date of the latest release                          |
| `projects`       | JSON string of detected packages                    |
| `dockerPackages` | Number of detected Docker packages                  |
| `npmPackages`    | Number of detected NPM packages                     |

## 🛠 Usage Example

```yaml
name: Repository Info

on:
  push:
    branches:
      - main

jobs:
  repo-info:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Get Repository Info
        uses: ./ # Replace with your action path or registry
        id: repo_info
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Print Output
        run: |
          echo "Environment: ${{ steps.repo_info.outputs.environment }}"
          echo "Monorepo: ${{ steps.repo_info.outputs.monorepo }}"
          echo "Last Tag: ${{ steps.repo_info.outputs.lastTag }}"
          echo "Last Release: ${{ steps.repo_info.outputs.releaseName }}"
```

# 📜 License

This project is licensed under the MIT License.
