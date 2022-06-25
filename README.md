# MailGun WebHook Processor

## Setup Guide

The resources beolow are required for a successful deployment of this code to AWS manually, but you can use the cloudformation template in the repo for a quick and easy setup.

* Login to AWS
* Create IAM role
  * attach policies (Cloudwatch, SNS, S3, etc..) and neccessary permission
* Create SNS Topic
* Create S3 bucket for storage
* Create API Gateway (REST API)
  * Create POST method
  * Lambda Invocation
  * Enable Lambda Proxy Integration
  * Add the role above to the lambda function
  * Create environment variables as seen in `.env.example` file
  * Create model to reduce invalid request sent to Lambda
  * click method request to add the new model to request body and set request validator to validate body, query string and headers

## Setup with cloudformation

* Login to AWS
* Search and open the cloudformation service
* click on create stack
* select the cloudformation template in this repo
* enter the neccessary paramters as you deem fit
* change the email paramter to an email you control to verify the notification service is working as expected
* continue clicking the next button until the stack creation process starts.
* Refresh the page and click on output to see the API Gateway URL created.
* run `npm install` to install dependencies
* run `npm build` to build the project
* copy the `index.js` file content and paste in the lambda function code section
* **Note** The lambda function can be seen in the resources tab in cloudformation
* click deploy on the lambda function
* VOILA!
* You can now test the endpoint seen in the output section.
* Ensure to change the event id for multiple test
* Verify you got the email from SNS
* Verify the data is stored in the created S3

## Sample payload to test API endpoint

``` json
  {
    "signature":
    {
      "timestamp": "1529006854",
      "token": "a8ce0edb2dd8301dee6c2405235584e45aa91d1e9f979f3de0",
      "signature": "50dd7709613e688fd1e2c445b680b1948fe09ea315d472df2c6c8db88154902b"
    },
    "event-data":
    {
      "event": "opened",
      "timestamp": 1529006854.329574,
      "id": "DACSsAdVSeGpLid7TN03WA"
    }
  }
```

## Snippet to generate valid mailgun signature

Please see the test signingKey in the example evnironment file

``` javascript
  const encodedToken = crypto
      .createHmac("sha256", signingKey)
      .update(timestamp.concat(token))
      .digest("hex");
```

## Sample Payload to test Lambda Function

``` json
  {
    "resource": "/",
    "path": "/",
    "httpMethod": "POST",
    "headers": null,
    "multiValueHeaders": null,
    "queryStringParameters": null,
    "multiValueQueryStringParameters": null,
    "pathParameters": null,
    "stageVariables": null,
    "requestContext": {
      "resourceId": "tz879dexv5",
      "resourcePath": "/",
      "httpMethod": "POST",
      "extendedRequestId": "Apsg-GFJIAMF1Og=",
      "requestTime": "09/Jun/2021:09:46:46 +0000",
      "path": "/",
      "accountId": "1234567890",
      "protocol": "HTTP/1.1",
      "stage": "test-invoke-stage",
      "domainPrefix": "testPrefix",
      "requestTimeEpoch": 1623232006020,
      "requestId": "2507c2d5-552a-421e-bc61-e4d740311e9b",
      "identity": {
        "cognitoIdentityPoolId": null,
        "cognitoIdentityId": null,
        "apiKey": "test-invoke-api-key",
        "principalOrgId": null,
        "cognitoAuthenticationType": null,
        "userArn": "arn:aws:iam::1234567890:root",
        "apiKeyId": "test-invoke-api-key-id",
        "userAgent": "aws-internal/3 aws-sdk-java/1.11.1014 Linux/5.4.102-52.177.amzn2int.x86_64 OpenJDK_64-Bit_Server_VM/25.292-b10 java/1.8.0_292 vendor/Oracle_Corporation cfg/retry-mode/legacy",
        "accountId": "1234567890",
        "caller": "1234567890",
        "sourceIp": "test-invoke-source-ip",
        "accessKey": "ABCDEFGHIJKLMNOPQRST",
        "cognitoAuthenticationProvider": null,
        "user": "1234567890"
      },
      "domainName": "testPrefix.testDomainName",
      "apiId": "in3trz7mpg"
    },
    "body": "{\n  \"signature\":\n  {\n    \"timestamp\": \"1529006854\",\n    \"token\": \"a8ce0edb2dd8301dee6c2405235584e45aa91d1e9f979f3de0\",\n    \"signature\": \"50dd7709613e688fd1e2c445b680b1948fe09ea315d472df2c6c8db88154902b\"\n  },\n  \"event-data\":\n  {\n    \"event\": \"opened\",\n    \"timestamp\": 1529006854.329574,\n    \"id\": \"DACSsAdVSeGpLid7TN03WA\"\n  }\n}",
    "isBase64Encoded": false
  }
```
