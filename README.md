
# AWS CDK Multi-Account Pipeline

A demo AWS CDK project that deploys a CodePipeline in the **deploy** account, which publishes an S3 bucket and a Lambda function to the **staging** account.


## Prerequisites

- Two AWS accounts: 
  - **Deploy account** (to host the pipeline)
  - **Staging account** (to deploy the resources)


## How to Deploy

### 1. Setup the Repository

1. **Fork this GitHub repository**.

2. **Generate a GitHub token**:
   - Go to [GitHub Developer Settings](https://github.com/settings/tokens).
   - Generate a "classic" token with the following scopes:
     - `repo`
     - `admin:repo_hook`

3. **Store the GitHub token** in AWS Secrets Manager:
   - Use the **deploy account's Management Console**.
   - Navigate to **Secrets Manager**.
   - Create a secret with:
     - **Name**: `github-token`
     - **Value**: your GitHub token.
   - This allows the pipeline to be notified of new commits and trigger deployments.

---

### 2. Bootstrap AWS CDK

#### Deploy Account
Run the following command with your **deploy account credentials**:
```bash
cdk bootstrap
```

#### Staging Account
Run the following command with your **staging account credentials**:
```bash
cdk bootstrap --trust <deploy-account-id> \
  --trust-for-lookup <deploy-account-id> \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```
This allows the deploy account to create stacks in the staging account.

---

### 3. Deployment

#### Create the `.env` File
Copy `.env.example` to a new file named `.env` and fill in the required values.

#### Deploy the Pipeline
Run the following command with your **deploy account credentials**:
```bash
cdk deploy
```

### Configure Environment Variables for the Pipeline
1. Go to **AWS Management Console** (in the deploy account):
   - Navigate to **CodeBuild** > **Build Projects**.
   - Select your build project (e.g., `PipelineBuildSynthCdk...`).
   - Click **Edit** > **Environment** > **Additional Configuration** > **Environment Variables**.

2. Add the following environment variable:
   - **Name**: `STG_ACCOUNT_ID`
   - **Value**: `<your-staging-account-id>`
   - **Type**: Plaintext

### Trigger the Pipeline
After adding the environment variable:
1. Go to **CodePipeline** in the AWS Management Console (deploy account).
2. Select your pipeline and click **Release Change** to deploy your app to staging account.

The pipeline is now set up and whenever a new commit is made to your branch, the changes will be deployed to staging account!
