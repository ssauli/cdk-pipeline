# AWS CDK Multi-account pipeline

***

Demo of AWS CDK that deploys a Codepipeline to "deploy" account that publishes a S3 bucket and a Lambda function to "staging" account.

## Prerequisites

- Two AWS Accounts

## How to deploy 

### Setup repository

Fork this github repo

Generate Github token "classic" with `repo` and `admin:repo_hook` scopes to your repo

In your AWS "deploy" account's Management Console, go to Secrets Manager service and create a secret named `github-token` with your github token as value. This allows pipeline to be notified of new commits and will trigger the pipeline to deploy the latest changes.

### Bootstrapping

Bootstrap AWS CDK on both accounts (creates base resources needed for CDK to deploy your CDK app):

Use "deploy" account credentials to run the following command:

`cdk bootstrap` 

Use "staging" account credentials to run the following command to allow deploy account to create stacks to it:

`cdk bootstrap --trust <deploy-account-id> --trust-for-lookup <deploy-account-id> --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess`

### Deployment

Make a copy of .env.example to a new file named `.env` in your project and fill in the values inside

Using "deploy" account credentials, run the following command to deploy the pipeline:

`cdk deploy`

#### Environment Variables

In "deploy" account's Management Console, go to:

Codebuild > Build Projects > PipelineBuildSynthCdk... > Edit > Environment > Additional configuration > Environment variables

Set environment variable:

> Name: STG_ACCOUNT_ID
> Value: <your-staging-account-id>
> Type: Plaintext
    
After adding the environment variable, in "deploy" account's management console, go to CodePipeline service and "Release Change" on your pipeline. 
