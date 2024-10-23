import * as cdk from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as ecs from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';

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

        // fargate task definition
        // task definition is a blueprint that describes how a Docker container should run
        //  Ensure that the total resource allocation for the task is within the limits specified. 
        // const fargateTaskDef = new ecs.FargateTaskDefinition(this, 'BackendFargateTaskDef', {
        //     memoryLimitMiB: 512,
        //     cpu: 256,
        // });

        // fargate container
        // Allow you to allocate resources to individual containers within the task.
        // const fargateContainer = fargateTaskDef.addContainer('BackendFargateContainer', {
        //     image: ecs.ContainerImage.fromAsset('../backend'),
        //     memoryLimitMiB: 512,
        //     cpu: 256,
        //     environment: {
        //         myVar: 'myValue'
        //     }
        // });

        // Create the Application Load Balancer
        // const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
        //     vpc,
        //     internetFacing: true
        // });

        // const listener = alb.addListener('Listener', {
        //     port: 80,
        //     open: true
        // });

        // // Create the Target Group
        // const targetGroup = listener.addTargets('ECS', {
        //     port: 80,
        //     targets: []
        // });

        // fargate service
        // const fargateService = new ecs.FargateService(this, 'BackendFargateService', {
        //     cluster: fargateCluster,
        //     taskDefinition: fargateTaskDef,
        //     desiredCount: 1
        // });

        // fargate service L3 construct 
        // it contain the ALB it self
        // memory and cup assign to the task definition 
        const fargateService = new ApplicationLoadBalancedFargateService(this, 'BackendFargateService', {
            cluster: fargateCluster,
            memoryLimitMiB: 1024,
            cpu: 512,
            desiredCount: 2,
            taskImageOptions: {
                image: ecs.ContainerImage.fromRegistry('../backend'),
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
