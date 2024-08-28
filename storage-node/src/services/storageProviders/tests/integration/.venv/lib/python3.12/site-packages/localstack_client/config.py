import os
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse

# note: leave this import here for now, as some upstream code is depending on it (TODO needs to be updated)
from localstack_client.patch import patch_expand_host_prefix  # noqa

# central entrypoint port for all LocalStack API endpoints
DEFAULT_EDGE_PORT = 4566

# TODO: deprecated, remove!
# NOTE: The ports listed below will soon become deprecated/removed, as the default in the
# latest version is to access all services via a single "edge service" (port 4566 by default)
_service_ports: Dict[str, int] = {
    "edge": 4566,
    "apigateway": 4567,
    "apigatewayv2": 4567,
    "kinesis": 4568,
    "dynamodb": 4569,
    "dynamodbstreams": 4570,
    "elasticsearch": 4571,
    "s3": 4572,
    "firehose": 4573,
    "lambda": 4574,
    "sns": 4575,
    "sqs": 4576,
    "redshift": 4577,
    "redshift-data": 4577,
    "es": 4578,
    "opensearch": 4578,
    "ses": 4579,
    "sesv2": 4579,
    "route53": 4580,
    "route53resolver": 4580,
    "cloudformation": 4581,
    "cloudwatch": 4582,
    "ssm": 4583,
    "secretsmanager": 4584,
    "stepfunctions": 4585,
    "logs": 4586,
    "events": 4587,
    "elb": 4588,
    "iot": 4589,
    "iotanalytics": 4589,
    "iotevents": 4589,
    "iotevents-data": 4589,
    "iotwireless": 4589,
    "iot-data": 4589,
    "iot-jobs-data": 4589,
    "cognito-idp": 4590,
    "cognito-identity": 4591,
    "sts": 4592,
    "iam": 4593,
    "rds": 4594,
    "rds-data": 4594,
    "cloudsearch": 4595,
    "swf": 4596,
    "ec2": 4597,
    "elasticache": 4598,
    "kms": 4599,
    "emr": 4600,
    "ecs": 4601,
    "eks": 4602,
    "xray": 4603,
    "elasticbeanstalk": 4604,
    "appsync": 4605,
    "cloudfront": 4606,
    "athena": 4607,
    "glue": 4608,
    "sagemaker": 4609,
    "sagemaker-runtime": 4609,
    "ecr": 4610,
    "qldb": 4611,
    "qldb-session": 4611,
    "cloudtrail": 4612,
    "glacier": 4613,
    "batch": 4614,
    "organizations": 4615,
    "autoscaling": 4616,
    "mediastore": 4617,
    "mediastore-data": 4617,
    "transfer": 4618,
    "acm": 4619,
    "codecommit": 4620,
    "kinesisanalytics": 4621,
    "kinesisanalyticsv2": 4621,
    "amplify": 4622,
    "application-autoscaling": 4623,
    "kafka": 4624,
    "apigatewaymanagementapi": 4625,
    "timestream": 4626,
    "timestream-query": 4626,
    "timestream-write": 4626,
    "s3control": 4627,
    "elbv2": 4628,
    "support": 4629,
    "neptune": 4594,
    "docdb": 4594,
    "servicediscovery": 4630,
    "serverlessrepo": 4631,
    "appconfig": 4632,
    "appconfigdata": 4632,
    "ce": 4633,
    "mediaconvert": 4634,
    "resourcegroupstaggingapi": 4635,
    "resource-groups": 4636,
    "efs": 4637,
    "backup": 4638,
    "lakeformation": 4639,
    "waf": 4640,
    "wafv2": 4640,
    "config": 4641,
    "configservice": 4641,
    "mwaa": 4642,
    "fis": 4643,
    "meteringmarketplace": 4644,
    "transcribe": 4566,
    "mq": 4566,
    "emr-serverless": 4566,
    "appflow": 4566,
    "route53domains": 4566,
    "keyspaces": 4566,
    "scheduler": 4566,
    "ram": 4566,
}

# TODO remove service port mapping above entirely
if os.environ.get("USE_LEGACY_PORTS") not in ["1", "true"]:
    for key, value in _service_ports.items():
        if key not in ["dashboard", "elasticsearch"]:
            _service_ports[key] = DEFAULT_EDGE_PORT


def parse_localstack_host(given: str) -> Tuple[str, int]:
    parts = given.split(":", 1)
    if len(parts) == 1:
        # just hostname
        return parts[0].strip() or "localhost", DEFAULT_EDGE_PORT
    elif len(parts) == 2:
        hostname = parts[0].strip() or "localhost"
        port_s = parts[1]
        try:
            port = int(port_s)
            return (hostname, port)
        except Exception:
            raise RuntimeError(f"could not parse {given} into <hostname>:<port>")
    else:
        raise RuntimeError(f"could not parse {given} into <hostname>:<port>")


def get_service_endpoints(localstack_host: Optional[str] = None) -> Dict[str, str]:
    """
    Return the local endpoint URLs for the list of supported boto3 services (e.g., "s3", "lambda", etc).
    If $AWS_ENDPOINT_URL is configured in the environment, it is returned directly. Otherwise,
    the service endpoint is constructed from the dict of service ports (usually http://localhost:4566).
    """
    env_endpoint_url = os.environ.get("AWS_ENDPOINT_URL", "").strip()
    if env_endpoint_url:
        return {key: env_endpoint_url for key in _service_ports.keys()}

    if localstack_host is None:
        localstack_host = os.environ.get(
            "LOCALSTACK_HOST", f"localhost:{DEFAULT_EDGE_PORT}"
        )

    hostname, port = parse_localstack_host(localstack_host)

    protocol = "https" if os.environ.get("USE_SSL") in ("1", "true") else "http"

    return {key: f"{protocol}://{hostname}:{port}" for key in _service_ports.keys()}


def get_service_endpoint(
    service: str, localstack_host: Optional[str] = None
) -> Optional[str]:
    endpoints = get_service_endpoints(localstack_host=localstack_host)
    return endpoints.get(service)


def get_service_port(service: str) -> Optional[int]:
    ports = get_service_ports()
    return ports.get(service)


def get_service_ports() -> Dict[str, int]:
    endpoints = get_service_endpoints()
    result = {}
    for service, url in endpoints.items():
        result[service] = urlparse(url).port
    return result
