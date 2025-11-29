// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MonSignal.sol";

contract TransferScript is Script {
    function run() external {
        uint256 senderPrivateKey = vm.envUint("PRIVATE_KEY");
        address tokenAddress = 0x1Ee5C0B33438aC921fAe7988E77b9c0aB6f7CE2A;
        address recipient = 0x09928ceBB4c977C5e5Db237a2A2cE5CD10497CB8; // Same as before

        vm.startBroadcast(senderPrivateKey);

        MonSignal token = MonSignal(tokenAddress);

        uint256 amount = 100 * 10 ** 18; // 100 MONSIG
        token.transfer(recipient, amount);

        console.log("Transferred 100 MONSIG to:", recipient);

        vm.stopBroadcast();
    }
}
