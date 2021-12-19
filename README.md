# Verifying signed messages in Clarity

Signature-checking in Clarity, how does it work? That is what this repository is about!

The `verified-messages` contract is a minimal example that shows how `secp256k1-recover?` is used to check if a message was signed by a specific principal.

- `verify-message` is a read-only function that simply checks if a signed message is valid.
- `post-message` is a public function that checks the message and emits a `print` event if it is valid. A message can only be posted once.

Messages are arbitrary data (ASCII in the examples), prefixed by `"Stacks Signed Message: "`. The prefix is to prevent an unsuspecting user from inadvertently signing a `presign-sighash`, which would allow an attacker to send a transaction on the signing-user's behalf.

There is no replay protection, which means that a message is valid across possible future forks of Stacks. To fix this a chain ID would have to be added to the message.

## Signing a message

There is a helper `scripts/sign-message.ts` that shows how to sign a message using the `@stacks/transactions` package.

Install dependencies with `npm install` first.

```
npm run sign-message

> stx-signed-message@1.0.0 sign-message
> ts-node ./scripts/sign-message.ts

Usage: npm run sign-message <private key> <message> (verbose [0/1])
Example: npm run sign-message 753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601 "Hello Clarity"
```

Verbose mode gives you a bunch of helpful information on what just happened, plus example contract calls that you can past straight into a `clarinet console` session.

```
npm run sign-message 753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601 "Hello Clarity"

> stx-signed-message@1.0.0 sign-message
> ts-node ./scripts/sign-message.ts "753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601" "Hello Clarity"

Message:                        Hello Clarity
Signer address (if mainnet):    SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRCBGD7R
Signer address (if testnet):    ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
Signature:                      0d45c08ce18e26d6268576321cf02ccdc2b53a0effcf862083a27851826a24741f83836f2ad9725712246d562bade29269b89c7f60069df9a6fefb75d894afcf01

You can verify the signature in a `clarinet console` session, by calling into the 'verified-messages' contract.

Mainnet:
(contract-call? .verified-messages verify-message 0x48656c6c6f20436c6172697479 0x0d45c08ce18e26d6268576321cf02ccdc2b53a0effcf862083a27851826a24741f83836f2ad9725712246d562bade29269b89c7f60069df9a6fefb75d894afcf01 'SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRCBGD7R)

Testnet:
(contract-call? .verified-messages verify-message 0x48656c6c6f20436c6172697479 0x0d45c08ce18e26d6268576321cf02ccdc2b53a0effcf862083a27851826a24741f83836f2ad9725712246d562bade29269b89c7f60069df9a6fefb75d894afcf01 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

## Signing with a wallet

A message-signing standard is still being worked on. It is not possible to sign messages with browser wallet extensions like Hiro Wallet at this time.

## Mainnet troubles

Even if you roll a custom signing solution to get around the web wallet limitation, you will still be unable to verify messages on mainnet. Unfortunately, a [critical bug](https://github.com/blockstack/stacks-blockchain/issues/2619) in Stacks 2.0 causes `principal-of?` to always return a testnet address. You will have to wait until Stacks 2.1 lands.

## Tests

Run tests with `clarinet test`.

```
* Can verify message ... ok (7ms)
* Invalid signatures fail (wrong message) ... ok (6ms)
* Invalid signatures fail (wrong signer) ... ok (6ms)
* Can post message ... ok (7ms)
* Can check if message was posted ... ok (8ms)
* Cannot post the same message twice ... ok (8ms)
* Cannot post message if signature is invalid ... ok (7ms)
```
