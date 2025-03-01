# InspectorAI CI/CD Integration Guide

This document provides detailed information on the Continuous Integration and Continuous Deployment (CI/CD) setup for InspectorAI.

## Table of Contents

- [Overview](#overview)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Setting Up CI/CD](#setting-up-cicd)
- [Testing Strategy](#testing-strategy)
- [Deployment Pipelines](#deployment-pipelines)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

InspectorAI uses GitHub Actions as its primary CI/CD platform. The CI/CD pipeline includes:

- Automated testing across multiple Node.js versions
- Code quality checks (linting, formatting)
- Build verification
- Automated deployment to staging and production environments
- NPM package publishing
- End-to-end testing in browser environments

## GitHub Actions Workflows

Three primary workflow files define the CI/CD process:

### 1. CI Workflow (.github/workflows/ci.yml)

This workflow runs on every push to the main branch and on all pull requests.

**Purpose**: Ensures code quality and validates that tests pass.

**Components**:
- Unit testing across Node.js 16.x, 18.x, and 20.x
- ESLint code quality checks
- TypeScript build verification
- Artifact generation

### 2. E2E Test Workflow (.github/workflows/e2e-tests.yml)

This workflow runs end-to-end tests in a real browser environment.

**Purpose**: Validates the application's functionality from a user perspective.

**Schedule**:
- Runs on pushes to main
- Runs on pull requests
- Runs daily at midnight UTC
- Can be manually triggered

**Components**:
- Sets up Chrome browser in the CI environment
- Starts the InspectorAI server
- Runs browser-based end-to-end tests
- Uploads screenshots and logs on failure

### 3. Deployment Workflow (.github/workflows/deploy.yml)

This workflow handles deployments to different environments and publishing to npm.

**Triggers**:
- Automatic publishing when a version tag is pushed
- Manual deployment to staging or production via workflow dispatch

**Components**:
- NPM package publishing job
- Staging environment deployment job
- Production environment deployment job
- Environment-specific configurations

## Setting Up CI/CD

### Prerequisites

1. GitHub repository with source code
2. NPM account (for publishing)
3. Staging and production servers (for deployment)
4. Required access tokens and SSH keys

### GitHub Secrets Configuration

Configure the following secrets in your repository settings:

- `NPM_TOKEN`: Authentication token for npm package publishing
- `STAGING_DEPLOY_KEY`: SSH private key for staging server deployment
- `STAGING_HOST`: Hostname or IP address of the staging server
- `PRODUCTION_DEPLOY_KEY`: SSH private key for production server deployment
- `PRODUCTION_HOST`: Hostname or IP address of the production server

### Environment Configuration

Set up GitHub environments for controlled deployments:

1. Go to your repository settings
2. Navigate to "Environments"
3. Create "staging" and "production" environments
4. Configure environment-specific protection rules:
   - Required reviewers for production
   - Wait timer for production (e.g., 10 minutes)
   - Branch restrictions for production (e.g., only main branch)

## Testing Strategy

InspectorAI employs a multi-level testing approach:

### Unit Tests

- Located in `tests/unit/`
- Run with Jest
- Test individual components in isolation
- Mock external dependencies

### Integration Tests

- Located in `tests/integration/`
- Test interactions between components
- May include API endpoint testing
- Validate expected behavior with real dependencies

### End-to-End Tests

- Located in `tests/e2e/`
- Run in a real browser environment
- Test complete user flows
- Validate visual elements and browser interactions

## Deployment Pipelines

### NPM Package Deployment

The automatic publishing workflow:

1. Triggered when a version tag is pushed (e.g., v1.0.0)
2. Checks out code
3. Sets up Node.js environment
4. Installs dependencies
5. Builds the package
6. Publishes to npm registry

**Usage**:
```bash
# Update version in package.json
npm version patch # or minor, or major
git push origin main --tags
```

### Staging Deployment

The staging deployment process:

1. Triggered manually via workflow dispatch
2. Builds the application
3. Transfers files to staging server
4. Restarts the application service

**Usage**:
1. Go to Actions tab in GitHub
2. Select "Deploy" workflow
3. Click "Run workflow"
4. Select "staging" from the dropdown
5. Click "Run workflow"

### Production Deployment

The production deployment process:

1. Triggered automatically by version tags or manually via workflow
2. Requires approval from authorized reviewers
3. Builds the application
4. Transfers files to production server
5. Performs rolling update to minimize downtime

## Best Practices

### Version Tagging

Always use semantic versioning (MAJOR.MINOR.PATCH):

- MAJOR: Breaking changes
- MINOR: New features, no breaking changes
- PATCH: Bug fixes, no new features or breaking changes

Example:
```bash
git tag v1.2.3
git push origin v1.2.3
```

### Pull Request Workflow

1. Create feature branch from main
2. Develop and test locally
3. Push to GitHub and create PR
4. CI automatically runs tests
5. Get code reviews
6. Merge to main when approved
7. CI runs on main branch
8. Create version tag when ready for release

### Deployment Safety

- Always deploy to staging first
- Perform smoke tests on staging
- Use feature flags for risky changes
- Implement monitoring and rollback procedures

## Troubleshooting

### Common CI Issues

#### Tests Failing in CI but Passing Locally

Possible causes:
- Environment differences
- Timing issues
- Browser version differences

Solution:
- Check CI logs for specific errors
- Ensure tests are not dependent on specific timing
- Add debugging output to tests

#### Deployment Failures

Possible causes:
- SSH key issues
- Server connectivity problems
- Permission issues on the server

Solution:
- Verify SSH key configuration
- Check server firewall settings
- Ensure correct permissions on target directories

#### NPM Publishing Issues

Possible causes:
- Invalid NPM token
- Version already exists
- Package.json configuration issues

Solution:
- Verify NPM token
- Check that version is properly incremented
- Validate package.json structure 