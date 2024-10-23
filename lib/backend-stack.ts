import * as cdk from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as ecs from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import * as path from 'path';

export class BackendStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        //create vpc
        const vpc = new Vpc(this, 'BackendVpc', {
            maxAzs: 2, // Default is all AZs in  region
            vpcName: 'backend-vpc-fargate',
            natGateways: 1
        });

        // fargate cluster
        const fargateCluster = new ecs.Cluster(this, 'BackendFargateCluster', {
            vpc: vpc
        });

        // Absolute path to the Docker image directory
        const dockerImagePath = path.resolve(__dirname, '../backend');


        // fargate service L3 construct 
        // it contain the ALB it self
        // memory and cup assign to the task definition 
        const fargateService = new ApplicationLoadBalancedFargateService(this, 'BackendFargateService', {
            cluster: fargateCluster,
            memoryLimitMiB: 1024,
            cpu: 512,
            desiredCount: 2,
            taskImageOptions: {
                image: ecs.ContainerImage.fromAsset(dockerImagePath),
                environment: {
                    myVar: 'myValue'
                }
            }
        });

        // Health check endpoint
        fargateService.targetGroup.configureHealthCheck({ path: '/health' });

        // load balancer url
        // to refernce it cloud front 
        new cdk.CfnOutput(this, 'LoadBalancerDNS', { 
            value: fargateService.loadBalancer.loadBalancerDnsName,
            exportName: 'LoadBalancerDNS'
        });

    }
} 
