// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../../node_modules/@openzeppelin/contracts/math/SafeMath.sol";
import "../lib/SafeMath32.sol";
import "../lib/SafeMath64.sol";

// Generic representation of ownership, assuming that each possible ownership consists of:
// - Type (ie. Member, Group, Curator etc.), which is represented by uint8 (and can be converted to/from enum)
// - Identifier (address/id/hash), which is represented by uint256
struct ChannelOwnership {
  uint8 ownershipType;
	uint256 ownerId;
}

// Any change to this struct requires ChannelStorage migration
struct Channel {
  ChannelOwnership ownership;
  bool isActive;
	uint32 videoLimit; // 0 = use default
  bool isExisting;
}

// A helper library to parse ChannelOwnership.
// New ownership types can be added if needed without the need for migration
// (but changing/removing existing ones would still require migration to new storage)
enum ChannelOwnerType { Address, Member, CuratorGroup }
library ChannelOwnershipDecoder {
	function isAddress(ChannelOwnership memory _ownership) internal pure returns (bool) {
		return _ownership.ownershipType == uint8(ChannelOwnerType.Address);
	}

	function isMember(ChannelOwnership memory _ownership) internal pure returns (bool) {
		return _ownership.ownershipType == uint8(ChannelOwnerType.Member);
	}

	function isCuratorGroup(ChannelOwnership memory _ownership) internal pure returns (bool) {
		return _ownership.ownershipType == uint8(ChannelOwnerType.CuratorGroup);
	}

	function asAddress(ChannelOwnership memory _ownership) internal pure returns (address) {
		require(
			isAddress(_ownership),
			"asAddress called on non-address ChannelOwnership"
		);
		return address(uint160(_ownership.ownerId));
	}

	function asMember(ChannelOwnership memory _ownership) internal pure returns (uint64) {
		require(
			isMember(_ownership),
			"asMember called on non-member ChannelOwnership"
		);
		return uint64(_ownership.ownerId);
	}

	function asCuratorGroup(ChannelOwnership memory _ownership) internal pure returns (uint16) {
		require(
			isCuratorGroup(_ownership),
			"asCuratorGroup called on non-group ChannelOwnership"
		);
		return uint16(_ownership.ownerId);
	}

	function isValid(ChannelOwnership memory _ownership) internal pure returns (bool) {
		if (isAddress(_ownership)) {
			return uint256(uint160(asAddress(_ownership))) == _ownership.ownerId;
		}
		if (isMember(_ownership)) {
			return uint256(asMember(_ownership)) == _ownership.ownerId;
		}
		if (isCuratorGroup(_ownership)) {
			return uint256(asCuratorGroup(_ownership)) == _ownership.ownerId;
		}
		return false;
	}
}

contract ChannelStorage is Ownable {
  mapping (uint64 => Channel) private channelById;
	// ownershipType => ownerId => channelCount double-map
  mapping (uint8 => mapping(uint256 => uint32)) public channelCountByOwnership;
  uint64 public nextChannelId = 1;

	using SafeMath32 for uint32;
	using SafeMath64 for uint64;

	function _incCountByOwnership (ChannelOwnership memory _ownership) internal {
    uint32 currentCount = channelCountByOwnership[_ownership.ownershipType][_ownership.ownerId];
    channelCountByOwnership[_ownership.ownershipType][_ownership.ownerId] = currentCount.add(1);
	}

	function _decCountByOwnership (ChannelOwnership memory _ownership) internal {
    uint32 currentCount = channelCountByOwnership[_ownership.ownershipType][_ownership.ownerId];
		channelCountByOwnership[_ownership.ownershipType][_ownership.ownerId] = currentCount.sub(1);
	}

  function addChannel (ChannelOwnership memory _ownership) public onlyOwner returns (uint64) {
		uint64 channelId = nextChannelId;
		// Get storage ref
		Channel storage newChannel = channelById[channelId];
		// Populate the struct
		newChannel.isExisting = true;
		newChannel.ownership = _ownership;
		_incCountByOwnership(_ownership);
		nextChannelId = nextChannelId.add(1);
		return channelId;
	}

	// Get channel + perform existance check
	function getExistingChannel(uint64 _channelId) public view returns (Channel memory) {
		Channel memory channel = channelById[_channelId];
		require(channel.isExisting, "Trying to access unexisting channel");
		return channel;
	}

  function updateOwnership (uint64 _channelId, ChannelOwnership memory _ownership) public onlyOwner {
		Channel storage channel = channelById[_channelId];
		_decCountByOwnership(channel.ownership);
		channel.ownership = _ownership;
		_incCountByOwnership(_ownership);
	}

  function updateStatus (uint64 _channelId, bool _isActive) public onlyOwner {
		Channel storage channel = channelById[_channelId];
		channel.isActive = _isActive;
	}

  function setChannelVideoLimit (uint64 _channelId, uint32 _videoLimit) public onlyOwner {
		Channel storage channel = channelById[_channelId];
		channel.videoLimit = _videoLimit;
	}

  function removeChannel (uint64 _channelId) public onlyOwner {
		_decCountByOwnership(channelById[_channelId].ownership);
		delete channelById[_channelId];
	}
}
