# AWS Three-Tier Web Application with CloudFormation

## Description
This project is a step-by-step guide to building and deploying a three-tier web application on AWS using CloudFormation (Infrastructure as Code). Instead of manually clicking through the AWS Console, the entire infrastructure — networking, security, compute, database, and content delivery — are written in code on CloudFormation templates and deployed through the command line. The app is a simple item manager with a frontend, a backend API , and a database. The goal is to demonstrate how to build production-style architecture with a secure, scalable, and fully automated setup like you would in a real production environment.
## Audience
This project is intended for anyone looking to learn AWS hands-on — whether you're pursuing a career in cloud computing, solutions architecture, or cloud security, or simply want to understand how real-world cloud infrastructure works. The assumption is that you have basic familiarity with AWS services like VPC, EC2, RDS, S3, CloudFront, and the AWS CLI. Step-by-step deployment instructions are provided so you can follow along even if you're still learning.

## Architecture Overview

![Architecture Diagram](architecture.png)

## CloudFormation Stacks

| Stack | Template | What It Creates |
|-------|----------|-----------------|
| VPC | `vpc.yaml` | VPC, 2 public subnets, 2 private subnets, Internet Gateway, route tables |
| Security | `security-groups.yaml` | ALB, EC2, and RDS security groups with least-privilege rules |
| Database | `rds.yaml` | RDS MySQL instance, DB subnet group, encrypted storage |
| Load Balancer | `alb.yaml` | ALB, target group, HTTP listener, health checks |
| Compute | `ec2-asg.yaml` | Launch template, Auto Scaling Group, scaling policy, IAM role |
| Frontend | `s3-cloudfront.yaml` | S3 bucket, CloudFront distribution with API routing |


## Prerequisites

> ⚠️ The installation commands in this project are designed for **macOS** . If you're using Windows or Linux, you'll need to modify the installation steps to match your operating system.


### Homebrew (Mac only — required for the installs below)
```bash
# Check if Homebrew is already installed
brew --version

# If you get "command not found", install it: 
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
> **NOTE:** You can get the latest version from [https://brew.sh](https://brew.sh)

```bash
# Verify
brew --version
```

### AWS CLI
```bash
# Install the AWS Command Line Interface
brew install awscli

# Verify 
aws --version
```

### Git
```bash
# Install Git for version control
brew install git

# Verify 
git --version
```

### Node.js
```bash
# Install Node.js and npm (JavaScript runtime and package manager)
brew install node

# Verify both are installed
node --version
npm --version
```

### GitHub Account
- A GitHub account to host the repository
- Sign up at [https://github.com](https://github.com) if you don't have one

### Budget Awareness
> ⚠️ Most resources in this project fall under the **AWS Free Tier**, but RDS and ALB may result in small charges if left running. Always run the cleanup commands when you're done to avoid unexpected costs.


## Setup

### 1. Create an AWS Account
- Sign up at [https://aws.amazon.com](https://aws.amazon.com) if you don't have one
- This will be your **root account** (the main admin account)

### 2. Create an IAM User
Don't use your root account for daily work — create a separate user for this Project:

1. Log into the [AWS Console](https://console.aws.amazon.com) with your root account
2. Search for and click **IAM**
3. Click **Users** → **Create user**
4. Enter a username (e.g., `your-name`) and click **Next**
5. Select **Attach policies directly**
6. Search for **AdministratorAccess**, check the box, and click **Next**
7. Click **Create user**

### 3. Create an Access Key
This is what lets your terminal talk to AWS:

1. In IAM, click **Users** → select the user you just created or want to use
2. Click the **Security credentials** tab
3. Scroll to **Access keys** → click **Create access key**
4. Select **Command Line Interface (CLI)** and click **Next**
5. (Optional) Add a **Set Discription Tag** (e.g., For Three-tier AWS web Application)
6. Click **Create access key** 

> ⚠️ **Important:** This is the only time you will be able to see or download your Secret Access Key. If you lose it, you cannot recover it — you will need to delete the old key and create a new one. Save both keys somewhere safe before closing this page.

> ⚠️ **Important:** Never share your access keys with anyone or push them to GitHub.

7. **Save both keys** 
   - Copy the **Access Key ID**
   - Copy the **Secret Access Key**


### 4. Configure AWS CLI
Open your terminal and run:
```bash
aws configure
```
You will be Asked for:
- **AWS Access Key ID** — paste the Access Key ID from Step 3
- **AWS Secret Access Key** — paste the Secret Access Key from Step 3
- **Default region** — `us-east-1`
- **Default output format** — `json`

### 5. Verify AWS Access
```bash
aws sts get-caller-identity
```
You should see output similar to:
```json
{
    "UserId": "AIDAXXXXXXXXXXXX", 
    "Account": "123456789012", - Should match the account number shown in the top right of your AWS Console
    "Arn": "arn:aws:iam::123456789012:user/your-username" - Should match User -> Summary -> ARN
}
```
If you get an access denied error, go back to Step 2 and verify your user has **AdministratorAccess** permissions.


## Helpful Terminal Commands

| Command | What It Does |
|---------|-------------|
| `cd folder-name` | Move into a folder |
| `cd ..` | Go back one folder |
| `pwd` | Show what folder you're currently in |
| `ls` | List files in the current folder |
| `q` | Exit a viewer (when output fills the screen) |
| `arrow up` | Repeat your last command |

## How to Deploy

### Step 1: Clone the Repository
```bash
# Navigate to the directory where you want this project to be saved
cd your/preferred/folder

# Download the project to your computer
git clone https://github.com/AlexDariio/three-tier-aws-app.git

# Move into the project folder
cd three-tier-aws-app
```

### Step 2: Deploy the VPC (Networking)
```bash
# Creates the VPC, subnets, internet gateway, and route tables
aws cloudformation create-stack --stack-name three-tier-vpc \
  --template-body file://cloudformation/vpc.yaml
```
Check for completion: 
```bash
aws cloudformation describe-stacks --stack-name three-tier-vpc --query 'Stacks[0].StackStatus'
```
Run this command every 30-60 seconds until the output changes from `"CREATE_IN_PROGRESS"` to `"CREATE_COMPLETE"`.
This may take a few minutes depending on the resource.

### Step 3: Deploy Security Groups
```bash
# Creates firewall rules for each tier (ALB, EC2, RDS) with least-privilege access
aws cloudformation create-stack --stack-name three-tier-security-groups \
  --template-body file://cloudformation/security-groups.yaml
```

Check deployment status:
```bash
aws cloudformation describe-stacks --stack-name three-tier-security-groups --query 'Stacks[0].StackStatus'
```
> Run this command every 30-60 seconds until the output changes from `"CREATE_IN_PROGRESS"` to `"CREATE_COMPLETE"`.

### Step 4: Deploy the Database (RDS)
```bash
aws cloudformation create-stack --stack-name three-tier-rds \
  --template-body file://cloudformation/rds.yaml \
  --parameters \
    ParameterKey=DBMasterUsername,ParameterValue=admin \
    ParameterKey=DBMasterPassword,ParameterValue=YourPasswordHere
```
> ⚠️ Replace `YourPasswordHere` with a secure password (minimum 8 characters). Save this password — you will need it in Step 6.

Check deployment status:
```bash
aws cloudformation describe-stacks --stack-name three-tier-rds --query 'Stacks[0].StackStatus'
```
> This is the longest step — it takes 5-10 minutes. Run the command every 60 seconds until it changes from `"CREATE_IN_PROGRESS"` to `"CREATE_COMPLETE"`.

### Step 5: Deploy the Application Load Balancer
```bash
# Creates the ALB, target group, and health checks to distribute traffic across EC2 instances
aws cloudformation create-stack --stack-name three-tier-alb \
  --template-body file://cloudformation/alb.yaml
```

Check deployment status:
```bash
aws cloudformation describe-stacks --stack-name three-tier-alb --query 'Stacks[0].StackStatus'
```
> Run this command every 30-60 seconds until the output changes from `"CREATE_IN_PROGRESS"` to `"CREATE_COMPLETE"`.

### Step 6: Create a Key Pair
```bash
# Check if the .ssh directory exists
ls ~/.ssh

# If .ssh directory exists, skip to "# Create a key pair" below

# If you get "No such file or directory", create it:
mkdir -p ~/.ssh

# Set directory permissions so only you can access it
chmod 700 ~/.ssh

# Create a key pair for SSH access (used to log into EC2 instances for debugging)
aws ec2 create-key-pair --key-name three-tier-key \
  --query 'KeyMaterial' --output text > ~/.ssh/three-tier-key.pem

# Set key file permissions to read-only for your user (required by SSH)
chmod 400 ~/.ssh/three-tier-key.pem

# Verify the key was created
ls ~/.ssh/three-tier-key.pem
```
> You should see `/Users/your-username/.ssh/three-tier-key.pem` printed back. If you get "No such file or directory", try running the key pair commands above again.

### Step 7: Deploy EC2 + Auto Scaling
```bash
# Get the database address from the RDS stack you deployed in Step 4
DB_ENDPOINT=$(aws rds describe-db-instances \
  --query 'DBInstances[0].Endpoint.Address' --output text)

# Verify the endpoint was saved (should show your RDS address)
echo $DB_ENDPOINT
```
It should print something like:
```
three-tier-app-db.xxxxxxxx.us-east-1.rds.amazonaws.com
```
> If it's empty, go back and make sure Step 4 (RDS) has reached `"CREATE_COMPLETE"` before continuing.
```bash
# Deploy the EC2 stack with Auto Scaling
aws cloudformation create-stack --stack-name three-tier-ec2 \
  --template-body file://cloudformation/ec2-asg.yaml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=three-tier-key \
    ParameterKey=DBEndpoint,ParameterValue=$DB_ENDPOINT \
    ParameterKey=DBPassword,ParameterValue=YourPasswordHere \
  --capabilities CAPABILITY_IAM
```
> ⚠️ Replace `YourPasswordHere` with the same password you used in Step 4.

Check deployment status:
```bash
aws cloudformation describe-stacks --stack-name three-tier-ec2 --query 'Stacks[0].StackStatus'
```
> Run this command every 30-60 seconds until the output changes from `"CREATE_IN_PROGRESS"` to `"CREATE_COMPLETE"`.

### Step 8: Deploy S3 + CloudFront (Frontend)
```bash
# Creates the S3 bucket for static files and CloudFront distribution for HTTPS delivery
aws cloudformation create-stack --stack-name three-tier-frontend \
  --template-body file://cloudformation/s3-cloudfront.yaml
```

Check deployment status:
```bash
aws cloudformation describe-stacks --stack-name three-tier-frontend --query 'Stacks[0].StackStatus'
```
> Run this command every 30-60 seconds until the output changes from `"CREATE_IN_PROGRESS"` to `"CREATE_COMPLETE"`. This step may take a few minutes as CloudFront distributions take time to deploy.

Once complete, upload the frontend files to S3:
```bash
# Get the S3 bucket name that CloudFormation created
BUCKET=$(aws cloudformation describe-stacks --stack-name three-tier-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' --output text)

# Upload your frontend files (HTML, CSS, JS) to the bucket
aws s3 sync frontend/ s3://$BUCKET/
```
 ### Step 9: Verify All Stacks Are Deployed
```bash
aws cloudformation describe-stacks --stack-name three-tier-vpc --query 'Stacks[0].StackStatus'
aws cloudformation describe-stacks --stack-name three-tier-security-groups --query 'Stacks[0].StackStatus'
aws cloudformation describe-stacks --stack-name three-tier-rds --query 'Stacks[0].StackStatus'
aws cloudformation describe-stacks --stack-name three-tier-alb --query 'Stacks[0].StackStatus'
aws cloudformation describe-stacks --stack-name three-tier-ec2 --query 'Stacks[0].StackStatus'
aws cloudformation describe-stacks --stack-name three-tier-frontend --query 'Stacks[0].StackStatus'
```
All should return `"CREATE_COMPLETE"`.

### Step 10: Verify the API Is Healthy
```bash
# Get the ALB DNS name
ALB_DNS=$(aws cloudformation describe-stacks --stack-name three-tier-alb \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' --output text)
# Test the health endpoint
curl http://$ALB_DNS/health
```
Expected output: `{"status":"healthy"}`
> If you see a `502 Bad Gateway` error or `{"status":"unhealthy"}`, wait 3-5 minutes and try again. The EC2 instances need time to fully start up, install dependencies, create the database, and pass the ALB health checks. This is normal on a fresh deployment.

### Step 11: Verify Targets Are Healthy Behind the Load Balancer
```bash
# Get the target group ARN (the group of EC2 instances behind the ALB)
TG_ARN=$(aws cloudformation describe-stacks --stack-name three-tier-alb \
  --query 'Stacks[0].Outputs[?OutputKey==`TargetGroupArn`].OutputValue' --output text)

# Check the health of each EC2 instance
aws elbv2 describe-target-health --target-group-arn $TG_ARN
```
All targets should show `"State": "healthy"`.

> If targets show `"unhealthy"`, wait a few minutes and run the command again. EC2 instances need time to boot up, install dependencies, and start the application before they can pass health checks.
### Step 12: Access Your Application
```bash
aws cloudformation describe-stacks --stack-name three-tier-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' --output text
```
Copy the URL shown and open in your browser. You should see the application running.

If you see your application running 
**You’ve Sucessfully Implemented a 3 Tier Web Architecture!**

## 🎉 Congratulations!

You have successfully deployed a fully automated three-tier web application on AWS! Your infrastructure includes a VPC with public and private subnets, an Application Load Balancer distributing traffic across auto-scaling EC2 instances, an RDS MySQL database secured in private subnets, and a static frontend delivered globally through CloudFront — all deployed through CloudFormation with zero manual console clicks.

> **Remember:** Don't forget to run the [Clean Up](#clean-up) steps when you're done to avoid unexpected AWS charges.

## Clean Up

In order to clean up the resources in your AWS account and avoid incurring any additional charges, you need to delete the stacks in reverse order. We start with the services deployed inside the VPC, then the VPC components themselves. CloudFormation handles deleting all the individual resources within each stack automatically.

> ⚠️ **Important:** You must empty the S3 bucket before deleting the frontend stack, otherwise CloudFormation will fail because it cannot delete a bucket that contains files.

> ⚠️ **Important:** Each stack must finish deleting before you move to the next step. Run the status check command after each delete and wait until it shows `"DELETE_COMPLETE"` or returns an error saying the stack does not exist (which means it's gone).

### Step 1: Empty and Delete the Frontend (S3 + CloudFront)
```bash
# Get the S3 bucket name
BUCKET=$(aws cloudformation describe-stacks --stack-name three-tier-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' --output text)

# Delete all files from the bucket
aws s3 rm s3://$BUCKET --recursive

# Delete the frontend stack
aws cloudformation delete-stack --stack-name three-tier-frontend

# Check status
aws cloudformation describe-stacks --stack-name three-tier-frontend --query 'Stacks[0].StackStatus'
```
> Note: CloudFront distributions can take a few minutes to fully delete. Wait for this to complete before moving on.

### Step 2: Delete the EC2 + Auto Scaling Stack
```bash
aws cloudformation delete-stack --stack-name three-tier-ec2

# Check status
aws cloudformation describe-stacks --stack-name three-tier-ec2 --query 'Stacks[0].StackStatus'
```

### Step 3: Delete the Application Load Balancer
```bash
aws cloudformation delete-stack --stack-name three-tier-alb

# Check status
aws cloudformation describe-stacks --stack-name three-tier-alb --query 'Stacks[0].StackStatus'
```

### Step 4: Delete the Database (RDS)
```bash
aws cloudformation delete-stack --stack-name three-tier-rds

# Check status
aws cloudformation describe-stacks --stack-name three-tier-rds --query 'Stacks[0].StackStatus'
```
> Note: This is the longest step — it takes 5-10 minutes as AWS deletes the database instance. Wait for completion before continuing.

### Step 5: Delete the Security Groups
```bash
aws cloudformation delete-stack --stack-name three-tier-security-groups

# Check status
aws cloudformation describe-stacks --stack-name three-tier-security-groups --query 'Stacks[0].StackStatus'
```

### Step 6: Delete the VPC
```bash
aws cloudformation delete-stack --stack-name three-tier-vpc

# Check status
aws cloudformation describe-stacks --stack-name three-tier-vpc --query 'Stacks[0].StackStatus'
```

### Step 7: Delete the Key Pair
```bash
# Delete the key pair from AWS
aws ec2 delete-key-pair --key-name three-tier-key

# Delete the local key file from your computer
rm ~/.ssh/three-tier-key.pem
```

### Step 8: Verify Everything is Deleted
```bash
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query 'StackSummaries[*].StackName' --output table
```
None of the `three-tier` stacks should appear in this list. If the table is empty, everything has been successfully cleaned up.