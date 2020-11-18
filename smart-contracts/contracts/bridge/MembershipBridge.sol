// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./auth.sol";

contract MembershipBridge is RuntimeManageable {
  mapping(uint64 => address) private controllerAddressByMemberId;

  constructor(RuntimeAddressProvider _provider) public RuntimeManageable(_provider) {}

  function setMemberAddress(uint64 _memberId, address _address) public onlyRuntime {
    controllerAddressByMemberId[_memberId] = _address;
  }

  function isMemberController(address _address, uint64 _memberId) public view returns (bool) {
    return (memberExists(_memberId) && controllerAddressByMemberId[_memberId] == _address);
  }

  function memberExists(uint64 _memberId) public view returns (bool) {
    return controllerAddressByMemberId[_memberId] != address(0);
  }
}
