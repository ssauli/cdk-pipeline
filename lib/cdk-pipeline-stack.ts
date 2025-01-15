import {
  pipelines,
  RemovalPolicy,
  SecretValue,
  Stack,
  StackProps,
  Stage,
  StageProps,
} from 'aws-cdk-lib';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export class CdkPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stgAccountId = process.env.STG_ACCOUNT_ID;
    const username = process.env.GITHUB_USERNAME;
    const repositoryName = process.env.GITHUB_REPOSITORY_NAME;
    const branchName = process.env.GITHUB_BRANCH_NAME as string;

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      pipelineName: 'CdkPipeline',
      crossAccountKeys: true,
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.gitHub(
          `${username}/${repositoryName}`,
          branchName,
          { authentication: SecretValue.secretsManager('github-token') },
        ),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),
    });

    if (stgAccountId) {
      const applicationStage = new ApplicationStage(this, 'ApplicationStage', {
        env: { account: stgAccountId, region: process.env.AWS_DEFAULT_REGION },
      });

      pipeline.addStage(applicationStage);
    } else {
      console.log(
        'Skipping ApplicationStage deployment because STG_ACCOUNT_ID is not defined',
      );
    }
  }
}

class ApplicationStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    new ApplicationStack(this, 'ApplicationStack', { env: props?.env });
  }
}

class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'HelloBucket', {
      removalPolicy: RemovalPolicy.DESTROY, // not a good idea for production workloads
    });

    const fn = new Function(this, 'HelloHandler', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda'),
      handler: 'hello.handler',
    });

    bucket.grantRead(fn);
    bucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(fn),
    );
    fn.addPermission('AllowS3Invoke', {
      principal: new ServicePrincipal('s3.amazonaws.com'),
      sourceArn: bucket.bucketArn,
    });
  }
}
