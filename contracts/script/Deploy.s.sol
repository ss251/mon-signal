// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MonSignal.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy with 1 million initial supply
        MonSignal token = new MonSignal(1_000_000 * 10 ** 18);

        console.log("MonSignal deployed at:", address(token));

        vm.stopBroadcast();
    }
}
