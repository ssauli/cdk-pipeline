import { pipelines, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class CdkPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.gitHub(
          'ssauli/cdk-pipeline',
          'main',
          { authentication: SecretValue.secretsManager('github-token') },
        ),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),
    });

    const hello = new Function(this, 'HelloHandler', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda'),
      handler: 'hello.handler',
    });
  }
}
