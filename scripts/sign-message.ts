#!/usr/bin/env ts-node

// Helper script to make playing around with this a little bit easier.
// DO NOT USE REAL SEED PHRASES OR PRIVATE KEYS.

// A message prefix is added to prevent the possibility of users
// getting tricked into inadvertently signing a presign-sighash. 
const ascii_message_prefix = 'Stacks Signed Message: ';

import { TransactionVersion } from '@stacks/common';
import { createStacksPrivateKey, getAddressFromPrivateKey, signWithKey, StacksPrivateKey } from '@stacks/transactions';
import { createHash } from 'crypto';

if (process.argv.length < 4) {
	console.log("Usage: npm run sign-message <private key> <message> (verbose [0/1])\nExample: npm run sign-message 753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601 \"Hello Clarity\"");
	process.exit(0);
}
const private_key = process.argv[2];
const message = process.argv[3] || '';
const verbose = !!parseInt(process.argv[4] || '1');

if (!/^(0x)?[0-9a-fA-F]{64,66}$/.test(private_key)) {
	console.log('Improperly formatted private key, it should be a hex string of 32 or 33 bytes.');
	process.exit(1);
}

function sign_ascii_message(private_key: StacksPrivateKey, message: string): Buffer {
	const hash = createHash('sha256').update(Buffer.from(`${ascii_message_prefix}${message}`, 'ascii')).digest();
	const data = signWithKey(private_key, hash.toString('hex')).data;
	// signWithKey returns a signature in vrs order, Clarity requires rsv.
	return Buffer.from(data.slice(2) + data.slice(0, 2), 'hex');
}

function hex_to_buffer(input: string) {
	return Buffer.from(input.length >= 2 && input[1] === 'x' ? input.slice(2) : input, 'hex');
}

const stacks_private_key = createStacksPrivateKey(hex_to_buffer(private_key));
const address_mainnet = getAddressFromPrivateKey(stacks_private_key.data, TransactionVersion.Mainnet);
const address_testnet = getAddressFromPrivateKey(stacks_private_key.data, TransactionVersion.Testnet);
const signature = sign_ascii_message(stacks_private_key, message);

!verbose
	? console.log(signature.toString('hex'))
	: console.log(
		`Message:\t\t\t${message}
Signer address (if mainnet):\t${address_mainnet}
Signer address (if testnet):\t${address_testnet}
Signature:\t\t\t${signature.toString('hex')}

You can verify the signature in a \`clarinet console\` session, by calling into the 'verified-messages' contract.

Mainnet:
(contract-call? .verified-messages verify-message 0x${Buffer.from(message, 'ascii').toString('hex')} 0x${signature.toString('hex')} '${address_mainnet})

Testnet:
(contract-call? .verified-messages verify-message 0x${Buffer.from(message, 'ascii').toString('hex')} 0x${signature.toString('hex')} '${address_testnet})`
	);
