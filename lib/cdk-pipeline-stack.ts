import {
  pipelines,
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

    const stgAccountId = process.env.STG_ACCOUNT_ID || undefined;

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      pipelineName: 'CdkPipeline',
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.gitHub(
          'ssauli/cdk-pipeline',
          'main',
          { authentication: SecretValue.secretsManager('github-token') },
        ),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),
    });

    const applicationStage = new ApplicationStage(this, 'ApplicationStage', {
      env: { account: stgAccountId },
    });

    pipeline.addStage(applicationStage);
  }
}

class ApplicationStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    new ApplicationStack(this, 'ApplicationStack');
  }
}

class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'HelloBucket', {});

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
