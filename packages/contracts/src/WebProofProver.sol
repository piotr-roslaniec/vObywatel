import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {Web, WebProof, WebProofLib, WebLib} from "vlayer-0.1.0/WebProof.sol";

// TODO
contract WebProofProver is Prover {
    using Strings for string;
    using WebProofLib for WebProof;
    using WebLib for Web;

    string dataUrl = "https://api.x.com/1.1/account/settings.json";

    function main(WebProof calldata webProof, address account)
    public
    view
    returns (Proof memory, string memory, address)
    {
        Web memory web = webProof.verify(dataUrl);

        string memory screenName = web.jsonGetString("screen_name");

        return (proof(), screenName, account);
    }
}
