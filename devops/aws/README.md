## Setup

### Configuring the AWS CLI
We’re going to use the AWS CLI to access AWS resources from the command line. 

Follow [the official directions](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) for your system.

Once the AWS CLI is installed, configure a profile and supply your aws access key and secret provided by your administartor:

`aws configure --profile my-new-profile`

You will be prompted to enter the key id and secret access key
```
AWS Access Key ID [None]: ******
AWS Secret Access Key [None]: **** 
```

### Create an SSH key pair to access deployed EC2 instances
Change profile and region parameters according to your configuration

```
aws ec2 create-key-pair --key-name my-ec2-ssh-key --profile my-new-profile --region us-east-1 --query 'KeyMaterial' --output text > my-ec2-ssh-key.pem
```

Set the permissions for the key pair 

`chmod 400 my-ec2-ssh-key.pem`

### Install Ansible
On Mac run the command:
* `brew install ansible`

Follow [the official installation guide](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html) for your system.

# How to deploy a simple Playground
Copy and edit the file `deploy-playground.sample.cfg` and update parameters like AWS_KEY_PAIR_NAME, KEY_PATH
Run the `deploy-playground.sh` script to deploy the playground

```
cd devops/aws
./deploy-playground.sh your-playground-config.cfg
```

On successfull deployment you should find the endpoints file on local machine
`endpoints.json`

You can use the network config endpoint in pioneer to connect it to the playground.

# How to deploy a network infrastructure
Copy and edit the file `deploy-infra.sample.cfg` and update parameters like AWS_KEY_PAIR_NAME, KEY_PATH
Run the `deploy-infra.sh` script to deploy the new network.

```
cd devops/aws
./deploy-infra.sh your-infra-deploy-config.cfg
```

# Remote access deployed EC2 instances
To ssh into EC2 instances/nodes make sure to use the ssh key configured for deployment eg.:

`ssh -i /path/to/key.pem ubuntu@1.2.3.4`

# To destroy a playground or network infrastructure

Pass the stack name and aws cli profile as environment variables and call the destroy-stack script
```
STACK_NAME=my-stack-name CLI_PROFILE=my-new-profile ./destroy-stack.sh
```

If you are using a shared AWS account with the rest of the team please be careful to not delete a stack you have not deployed yourself.