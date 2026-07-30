1. the insight is proven, not shown.

nightSignals — a privacy-preserving insight marketplace on midnight network. creators sell trading signals with cryptographic proof. buyers verify on-chain. the actual content never touches the public ledger. selective disclosure is the core primitive.


2. how it works in four steps.

create signal — hash the insight in a ZK circuit, disclose only price and hash to the chain. purchase access — pay in tNIGHT, buyer identity stays shielded. off-chain delivery — any channel works, the chain holds the proof not the payload. verify authenticity — hash the received content, compare to on-chain hash. match proves it is real. mismatch is cryptographic proof of fraud.


3. what the chain sees vs what stays private.

public ledger: content hash, price, buyer count, creator ZK identity, active status. private witness: signal content encrypted, creator wallet untraceable, buyer identity shielded, decryption key local only. the chain confirms the trade is valid without ever seeing what was traded.


4. built with compact v0.23 on midnight preprod.

three ZK circuits — createSignal, purchaseSignal, deactivateSignal. thirteen tests passing on every push. CI/CD pipeline running. lace wallet integration via midnight DApp connector API. fully functional marketplace with browse, create, and purchase flows.


5. fifty preprod users tested it. the numbers speak.

four point three out of five average satisfaction across structured feedback. the privacy model resonated — users understood the content hash on-chain versus content off-chain split without explanation. the dark UI with purple accents felt midnight-native. built for the midnight moonshots hackathon.


6. anyone can claim a ninety percent win rate. there is no cryptographic proof.

nightSignals changes that — immutable content hashes on-chain make creator reputation verifiable, not claimed. this is what confidential credentials look like on midnight.
