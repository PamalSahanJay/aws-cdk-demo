import * as cdk from 'aws-cdk-lib';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { AllowedMethods, Distribution, OriginAccessIdentity, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from "aws-cdk-lib/aws-certificatemanager";

interface CustomStackProps extends cdk.StackProps {
    stage: string;
}

export class BackendClass extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: CustomStackProps) {
        super(scope, id, props);

        const loadBalancerDomain = cdk.Fn.importValue("loadBalancerUrl");

        // Getting external configuration values from cdk.json file
        const config = this.node.tryGetContext("stages")[props.stage];


        // SSL certificate 
        const certificateArn = acm.Certificate.fromCertificateArn(this, "tlsCertificate", config.certificateArn);


        // Web hosting bucket creation
        let websiteBucket = new Bucket(this, "websiteBucket", {
            versioned: false,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // Trigger frontend deployment
        new BucketDeployment(this, "websiteDeployment", {
            sources: [Source.asset("../frontend/build")],
            destinationBucket: websiteBucket
        });

        // Create Origin Access Identity for CloudFront
        const originAccessIdentity = new OriginAccessIdentity(this, "cloudfrontOAI", {
            comment: "OAI for web application cloudfront distribution",
        });

        // Creating CloudFront distribution
        let cloudFrontDist = new Distribution(this, "cloudfrontDist", {
            defaultRootObject: "index.html",
            domainNames: ["enlearacademy.tk"],
            certificate: certificateArn,
            defaultBehavior: {
                origin: new origins.S3Origin(websiteBucket, {
                    originAccessIdentity: originAccessIdentity,
                }),
                compress: true,
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                viewerProtocolPolicy: ViewerProtocolPolicy.ALLOW_ALL,
            },
        });
    }



}