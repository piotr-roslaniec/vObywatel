// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Strings} from "@openzeppelin-contracts-5.0.1/utils/Strings.sol";

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {Web, WebProof, WebProofLib, WebLib} from "vlayer-0.1.0/WebProof.sol";

contract WebProofProver is Prover {
    using Strings for string;
    using WebProofLib for WebProof;
    using WebLib for Web;

    string constant DATA_URL =
        "https://konfigurator.biznes.gov.pl/api/v2/ceidg/my-business/";

    function main(
        WebProof calldata webProof,
        address account
    ) public view returns (Proof memory, string memory, address) {
        Web memory web = webProof.recover(DATA_URL);

        string memory screenName = web.jsonGetString("nip");

        return (proof(), screenName, account);
    }
}
