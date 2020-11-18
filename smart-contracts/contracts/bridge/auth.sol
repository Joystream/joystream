// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

// Provider of runtime-hardcoded addresses
// (can be customized for testing purposes)
contract RuntimeAddressProvider {
  address public runtimeAddress;
  address public councilAddress;

  constructor(address _runtimeAddress, address _councilAddress) public {
    // The address hardcoded in the runtime, used to update bridges
    // (and possibly other operations that shouldn't be done via proposal)
    runtimeAddress = _runtimeAddress;
    // This is the address hardcoded in the runtime proposal module
    // (can only be used in context of proposal execution)
    councilAddress = _councilAddress;
  }
}

// Abstract contract providing modifiers for contracts that can be managed through runtime/proposals
abstract contract RuntimeManageable {
  RuntimeAddressProvider public runtimeAddressProvider;

  constructor(RuntimeAddressProvider _runtimeAddressProvider) public {
    runtimeAddressProvider = _runtimeAddressProvider;
  }

  modifier onlyRuntime {
    require(
      msg.sender == runtimeAddressProvider.runtimeAddress(),
      "This function can only be executed from the runtime"
    );
    _;
  }

  modifier onlyCouncil {
    require(
      msg.sender == runtimeAddressProvider.councilAddress(),
      "This function can only be executed through proposal system"
    );
    _;
  }
}
