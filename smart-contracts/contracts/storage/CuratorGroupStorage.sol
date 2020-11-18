// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts/access/Ownable.sol";

import "../lib/SafeMath8.sol";
import "../lib/SafeMath16.sol";
import "../lib/SafeMath32.sol";

// Any change to this struct requires CuratorGroupStorage migration
struct Group {
  bool isExisting;
  uint32 curatorsCount;
  // A generic, storage representation of group permissions' flags
  // Those flags can have different meanings depending on current logic implementation
  bool[] permissions;
}

contract CuratorGroupStorage is Ownable {
  using SafeMath8 for uint8;
  using SafeMath16 for uint16;
  using SafeMath32 for uint32;

  // curatorId => groupId => boolean double-map representing curator membership in group
  mapping(uint64 => mapping(uint16 => bool)) private isCuratorInGroup;

  mapping(uint16 => Group) private groupById;

  uint16 public nextGroupId = 1;

  function addGroup(bool[] memory _permissions) public onlyOwner returns (uint16) {
    uint16 groupId = nextGroupId;
    // Get storage ref
    Group storage newGroup = groupById[groupId];
    // Populate the struct
    newGroup.isExisting = true;
    newGroup.permissions = _permissions;
    nextGroupId = nextGroupId.add(1);
    return groupId;
  }

  function setGroupPermissions(uint16 _groupId, bool[] memory _permissions) public onlyOwner returns (uint16) {
    Group storage group = groupById[_groupId];
    group.permissions = _permissions;
  }

  function groupExists(uint16 _groupId) public view returns (bool) {
    return groupById[_groupId].isExisting;
  }

  function getExistingGroup(uint16 _groupId) public view returns (Group memory) {
    require(this.groupExists(_groupId), "Trying to access unexisting group");
    return groupById[_groupId];
  }

  function isCuratorInExistingGroup(uint64 _curatorId, uint16 _groupId) public view returns (bool) {
    return (groupExists(_groupId) && isCuratorInGroup[_curatorId][_groupId]);
  }

  function addCuratorToGroup(uint64 _curatorId, uint16 _groupId) public onlyOwner {
    Group storage group = groupById[_groupId];
    isCuratorInGroup[_curatorId][_groupId] = true;
    group.curatorsCount = group.curatorsCount.add(1);
  }

  function removeCuratorFromGroup(uint64 _curatorId, uint16 _groupId) public onlyOwner {
    Group storage group = groupById[_groupId];
    isCuratorInGroup[_curatorId][_groupId] = false;
    group.curatorsCount = group.curatorsCount.sub(1);
  }

  function removeCuratorFromAllGroups(uint64 _curatorId) public onlyOwner {
    for (uint16 i = 1; i < nextGroupId; i = i.add(1)) {
      if (isCuratorInGroup[_curatorId][i]) {
        removeCuratorFromGroup(_curatorId, i);
      }
    }
  }

  // TODO: Is there a value in removing a group that has no curators and no channels anymore?
  function removeGroup(uint16 _groupId) public onlyOwner {
    delete groupById[_groupId]; // Will set isExisting to false
  }
}
