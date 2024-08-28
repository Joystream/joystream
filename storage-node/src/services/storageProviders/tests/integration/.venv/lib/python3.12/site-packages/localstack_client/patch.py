import types

import boto3
from boto3.session import Session
from botocore.serialize import Serializer

_state = {}

DEFAULT_ACCESS_KEY_ID = "test"
DEFAULT_SECRET_ACCESS_KEY = "test"


def enable_local_endpoints():
    """Patch the boto3 library to transparently use the LocalStack endpoints by default."""
    from localstack_client.config import get_service_endpoint

    def _add_custom_kwargs(
        kwargs,
        service_name,
        endpoint_url=None,
        aws_access_key_id=None,
        aws_secret_access_key=None,
    ):
        kwargs["endpoint_url"] = endpoint_url or get_service_endpoint(service_name)
        kwargs["aws_access_key_id"] = aws_access_key_id or DEFAULT_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = (
            aws_secret_access_key or DEFAULT_SECRET_ACCESS_KEY
        )

    def _client(
        self,
        service_name,
        region_name=None,
        api_version=None,
        use_ssl=True,
        verify=None,
        endpoint_url=None,
        aws_access_key_id=None,
        aws_secret_access_key=None,
        **kwargs,
    ):
        _add_custom_kwargs(
            kwargs,
            service_name,
            endpoint_url=endpoint_url,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
        )
        return _client_orig(
            self,
            service_name,
            region_name=region_name,
            api_version=api_version,
            use_ssl=use_ssl,
            verify=verify,
            **kwargs,
        )

    def _resource(
        self,
        service_name,
        region_name=None,
        api_version=None,
        use_ssl=True,
        verify=None,
        endpoint_url=None,
        aws_access_key_id=None,
        aws_secret_access_key=None,
        **kwargs,
    ):
        _add_custom_kwargs(
            kwargs,
            service_name,
            endpoint_url=endpoint_url,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
        )
        return _resource_orig(
            self,
            service_name,
            region_name=region_name,
            api_version=api_version,
            use_ssl=use_ssl,
            verify=verify,
            **kwargs,
        )

    if _state.get("_client_orig"):
        # patch already applied -> return
        return

    # patch boto3 default session (if available)
    try:
        session = boto3._get_default_session()
        _state["_default_client_orig"] = session.client
        session.client = types.MethodType(_client, session)
        _state["_default_resource_orig"] = session.resource
        session.resource = types.MethodType(_resource, session)
    except Exception:
        # swallowing for now - looks like the default session is not available (yet)
        pass

    # patch session.client(..)
    _client_orig = Session.client
    _state["_client_orig"] = _client_orig
    Session.client = _client

    # patch session.resource(..)
    _resource_orig = Session.resource
    _state["_resource_orig"] = _resource_orig
    Session.resource = _resource


def disable_local_endpoints():
    """Disable the boto3 patches and revert to using the default endpoints against real AWS."""

    _client = _state.pop("_client_orig", None)
    if _client:
        Session.client = _client
    _resource = _state.pop("_resource_orig", None)
    if _resource:
        Session.resource = _resource

    # undo patches for boto3 default session
    try:
        session = boto3._get_default_session()
        if _state.get("_default_client_orig"):
            session.client = _state["_default_client_orig"]
        if _state.get("_default_resource_orig"):
            session.resource = _state["_default_resource_orig"]
    except Exception:
        pass


def patch_expand_host_prefix():
    """Apply a patch to botocore, to skip adding host prefixes to endpoint URLs"""

    def _expand_host_prefix(self, parameters, operation_model, *args, **kwargs):
        result = _expand_host_prefix_orig(
            self, parameters, operation_model, *args, **kwargs
        )
        # skip adding host prefixes, to avoid making requests to, e.g., http://data-localhost:4566
        is_sd = operation_model.service_model.service_name == "servicediscovery"
        if is_sd and result == "data-":
            return None
        if operation_model.service_model.service_name == "mwaa" and result == "api.":
            return None
        return result

    _expand_host_prefix_orig = Serializer._expand_host_prefix
    Serializer._expand_host_prefix = _expand_host_prefix
