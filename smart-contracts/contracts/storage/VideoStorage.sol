// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../lib/SafeMath64.sol";

// Any change to this struct requires VideoStorage migration
struct Video {
    uint64 channelId;
    bool isActive;
    bool isExisting;
}

contract VideoStorage is Ownable {
	using SafeMath64 for uint64;

  mapping (uint64 => Video) private videoById;
  mapping (uint64 => uint64) public videoCountByChannelId;
  uint64 nextVideoId = 1;

  function addVideo (uint64 _channelId) public onlyOwner returns (uint64) {
		uint64 videoId = nextVideoId;
		// Get storage ref
		Video storage newVideo = videoById[videoId];
		// Populate the struct
		newVideo.isExisting = true;
		newVideo.isActive = true;
		newVideo.channelId = _channelId;
		// Update counters
		videoCountByChannelId[_channelId] = videoCountByChannelId[_channelId].add(1);
		nextVideoId = nextVideoId.add(1);
		return videoId;
	}

	// Get video + perform existance check
	function getExistingVideo(uint64 _videoId) public view returns (Video memory) {
		Video memory video = videoById[_videoId];
		require(video.isExisting, "Trying to access unexisting video");
		return video;
	}

	function updateStatus (uint64 _videoId, bool _isActive) public onlyOwner {
		// Get storage ref
		Video storage video = videoById[_videoId];
		// Update the value in struct
		video.isActive = _isActive;
	}

  function removeVideo (uint64 _videoId) public onlyOwner {
		// Dec videoCountByChannel
    uint64 _channelId = videoById[_videoId].channelId;
		videoCountByChannelId[_channelId] = videoCountByChannelId[_channelId].sub(1);
		// Clear entry in map (setting isExisting to false)
    delete videoById[_videoId];
	}
}
