const AWS = require("aws-sdk");
import {
  EventData,
  Signature,
  EventContent
} from "./types"


AWS.config.update({
  region: process.env.REGION ? process.env.REGION : "us-east-1",
});

class WebhookProcessor {
  request: any;
  provider: string;
  event: EventData;
  signature: Signature;
  eventContent: EventContent;

  constructor(provider: string, request: any) {
    let parsedBody = JSON.parse(request.body);
    
    this.request = request;
    this.provider = provider;
    this.event = parsedBody["event-data"];
    this.signature = parsedBody.signature;
    this.eventContent = {
      Provider: provider,
      timestamp: this.event.timestamp,
      type: `email ${this.event.event}`,
    };
  }

  validateEnvironmentVariables() {
    if (!process.env.SIGNING_KEY) {
      throw new Error("Please provide a signing key");
    }
    if (!process.env.NOTIFICATION_SERVICE) {
      throw new Error("Please specify notification service");
    }
    if (!process.env.STORAGE_SERVICE) {
      throw new Error("Please specify storage service");
    }
  }

  async processWebHook() {
    let body: string;
    let statusCode = "200";
    const headers = {
      "Content-Type": "application/json",
    };

    this.validateEnvironmentVariables();

    if (
      this.isVerifiedSender(
        process.env.SIGNING_KEY,
        this.signature.timestamp,
        this.signature.token,
        this.signature.signature
      )
    ) {
      try {
        switch (this.request.httpMethod) {
          case "POST":
            body = await this.sendNotification(
              process.env.NOTIFICATION_SERVICE
            );
            body += await this.storeEventLog(process.env.STORAGE_SERVICE);

            break;
          default:
            throw new Error(`Unsupported method "${this.request.httpMethod}"`);
        }
      } catch (err) {
        statusCode = "400";
        body = err.message;
      } finally {
        body = JSON.stringify(body);
      }
    } else {
      statusCode = "400";
      body = "Unauthorised request";
    }

    return {
      statusCode,
      body,
      headers,
    };
  }

  isVerifiedSender(
    signingKey: string,
    timestamp: string,
    token: string,
    signature: string
  ) {
    const crypto = require("crypto");
    const encodedToken = crypto
      .createHmac("sha256", signingKey)
      .update(timestamp.concat(token))
      .digest("hex");
    return encodedToken === signature;
  }

  async processSNS() {
    if (!process.env.SNS_ARN) {
      throw new Error("Please specify SNS ARN");
    }

    let sns = new AWS.SNS({ apiVersion: "2010-03-31" });
    let snsParams = {
      Message: JSON.stringify(this.eventContent, null, 2),
      Subject: `${this.provider} Webhook Notification`,
      TopicArn: process.env.SNS_ARN,
    };

    // Create promise and SNS service object
    var snsResult = await sns.publish(snsParams).promise();
    if (snsResult.MessageId) {
      console.log(
        `Message ${snsParams.Message} sent to the topic ${snsParams.TopicArn}`
      );
    } else {
      console.log("Failed to send notification");
    }
  }

  async processS3() {
    if (!process.env.S3_BUCKET_NAME) {
      throw new Error("Please specify S3 bucket name");
    }

    let s3 = new AWS.S3({ apiVersion: "2006-03-01" });

    var bucketName = process.env.S3_BUCKET_NAME
    let keyName = `${this.event.id}.txt`;

    var objectParams = {
      Bucket: bucketName,
      Key: keyName,
      Body: JSON.stringify(this.eventContent, null, 2),
    };

    // Create object upload promise
    var uploadResult = await s3.putObject(objectParams).promise();
    console.log(uploadResult);

    if (uploadResult.ETag) {
      console.log(
        "Successfully uploaded data to " + bucketName + "/" + keyName
      );
    } else {
      console.log("Upload failed");
    }
  }

  async sendNotification(service: string) {
    switch (service) {
      case "sns":
        await this.processSNS();
        break;
      default:
        throw new Error(`Please provide a service`);
    }
    return "Notification sent successfully.";
  }

  async storeEventLog(service: string) {
    switch (service) {
      case "s3":
        await this.processS3();
        break;
      default:
        throw new Error(`Please provide a service`);
    }
    return "Event stored successfully.";
  }
}

const handler = async (event, context) => {
  const mailgun = new WebhookProcessor("Mailgun", event);
  const processResponse = await mailgun.processWebHook();
  return processResponse;
};

exports.handler = handler;
