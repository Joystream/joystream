// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./auth.sol";

contract ContentWorkingGroupBridge is RuntimeManageable {
  // A map of curatorId => evmAddress(roleKey)
  mapping(uint64 => address) private addressByCuratorId;

  // evmAddress(roleKey) of current lead
  address public currentLeadAddress;

  // Lead status managed by the council
  bool public isLeadActive = true;

  constructor(RuntimeAddressProvider _provider) public RuntimeManageable(_provider) {}

  function setCuratorAddress(uint64 _curatorId, address _address) public onlyRuntime {
    addressByCuratorId[_curatorId] = _address;
  }

  function setLeadAddress(address _address) public onlyRuntime {
    currentLeadAddress = _address;
  }

  function setLeadStatus(bool _status) public onlyCouncil {
    isLeadActive = _status;
  }

  function isCurator(address _address, uint64 _curatorId) public view returns (bool) {
    return (curatorExists(_curatorId) && addressByCuratorId[_curatorId] == _address);
  }

  function curatorExists(uint64 _curatorId) public view returns (bool) {
    return addressByCuratorId[_curatorId] != address(0);
  }

  function isActiveLead(address _address) public view returns (bool) {
    return (isLeadActive && currentLeadAddress != address(0) && currentLeadAddress == _address);
  }
}
