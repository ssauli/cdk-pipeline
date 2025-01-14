import { Handler } from 'aws-cdk-lib/aws-lambda';

export const handler: Handler = async function (event: any) {
  console.log('request:', JSON.stringify(event, undefined, 2));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: `Hello, CDK! You've hit ${event.path}\n`,
  };
};
