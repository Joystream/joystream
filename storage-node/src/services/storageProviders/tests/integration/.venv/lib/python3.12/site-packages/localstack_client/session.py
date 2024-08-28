from boto3 import client as boto3_client
from boto3 import resource as boto3_resource
from botocore.credentials import Credentials

from localstack_client import config

DEFAULT_SESSION = None


class Session(object):
    """
    This is a custom LocalStack session used to
    emulate the boto3.session object.
    """

    def __init__(
        self,
        aws_access_key_id="accesskey",
        aws_secret_access_key="secretkey",
        aws_session_token="token",
        region_name="us-east-1",
        botocore_session=None,
        profile_name=None,
        localstack_host=None,
    ):
        self.env = "local"
        self.aws_access_key_id = aws_access_key_id
        self.aws_secret_access_key = aws_secret_access_key
        self.aws_session_token = aws_session_token
        self.region_name = region_name
        self._service_endpoint_mapping = config.get_service_endpoints(localstack_host)

        self.common_protected_kwargs = {
            "aws_access_key_id": self.aws_access_key_id,
            "aws_secret_access_key": self.aws_secret_access_key,
            "region_name": self.region_name,
            "verify": False,
        }

    def get_credentials(self):
        """
        Returns botocore.credential.Credential object.
        """
        return Credentials(
            access_key=self.aws_access_key_id,
            secret_key=self.aws_secret_access_key,
            token=self.aws_session_token,
        )

    def client(self, service_name, **kwargs):
        """
        Mock boto3 client
        If **kwargs are provided they will passed through to boto3.client unless already contained
        within protected_kwargs which are set with priority
        Returns boto3.resources.factory.s3.ServiceClient object
        """
        if service_name not in self._service_endpoint_mapping:
            raise Exception(
                "%s is not supported by this mock session." % (service_name)
            )

        protected_kwargs = {
            **self.common_protected_kwargs,
            "service_name": service_name,
            "endpoint_url": self._service_endpoint_mapping[service_name],
        }

        return boto3_client(**{**kwargs, **protected_kwargs})

    def resource(self, service_name, **kwargs):
        """
        Mock boto3 resource
        If **kwargs are provided they will passed through to boto3.client unless already contained
        within overwrite_kwargs which are set with priority
        Returns boto3.resources.factory.s3.ServiceResource object
        """
        if service_name not in self._service_endpoint_mapping:
            raise Exception(
                "%s is not supported by this mock session." % (service_name)
            )

        protected_kwargs = {
            **self.common_protected_kwargs,
            "service_name": service_name,
            "endpoint_url": self._service_endpoint_mapping[service_name],
        }

        return boto3_resource(**{**kwargs, **protected_kwargs})


def _get_default_session():
    global DEFAULT_SESSION

    if DEFAULT_SESSION is None:
        DEFAULT_SESSION = Session()

    return DEFAULT_SESSION


def client(*args, **kwargs):
    if kwargs:
        return Session(**kwargs).client(*args, **kwargs)
    return _get_default_session().client(*args, **kwargs)


def resource(*args, **kwargs):
    if kwargs:
        return Session(**kwargs).resource(*args, **kwargs)
    return _get_default_session().resource(*args, **kwargs)
