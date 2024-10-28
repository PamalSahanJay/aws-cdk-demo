import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecspatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as path from 'path';

export class BackendStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        //create vpc
        const vpc = new ec2.Vpc(this, 'BackendVpc', {
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
        const fargateService = new ecspatterns.ApplicationLoadBalancedFargateService(this, 'BackendFargateService', {
            cluster: fargateCluster,
            memoryLimitMiB: 1024,
            cpu: 512,
            desiredCount: 2,
            taskImageOptions: {
                image: ecs.ContainerImage.fromAsset(dockerImagePath),
                containerPort: 80,
            }
        });

        // Health check endpoint
        fargateService.targetGroup.configureHealthCheck({ path: "/health" });

        // load balancer url
        // to refernce it cloud front 
        new cdk.CfnOutput(this, 'LoadBalancerDNS', { 
            value: fargateService.loadBalancer.loadBalancerDnsName,
            exportName: 'LoadBalancerDNS'
        });

    }
} 
