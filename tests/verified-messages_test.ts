import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const ErrorCodes = {
	MessageAlreadyPosted: 100,
	InvalidSignature: 101
};

function stringToArrayBuffer(str: string) {
	return new TextEncoder().encode(str);
}

Clarinet.test({
	name: "Can verify message",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!;
		const args = [
			/* message   */ types.buff(stringToArrayBuffer('Hello Clarity')),
			/* signature */ '0xba81fcf2352d66fef730d726be484842f4eb2c1f2bde8c27724fa96a5851b41a566c2481da26d841f703ea846adcdc29e6effeb1293b6527b44cb7f20e8b5ea800',
			/* signer    */ types.principal('ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5')
		]
		const response = chain.callReadOnlyFn('verified-messages', 'verify-message', args, deployer.address);
		response.result.expectBool(true);
	}
});

Clarinet.test({
	name: "Invalid signatures fail (wrong message)",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!;
		const args = [
			/* message   */ types.buff(stringToArrayBuffer('Hello Clarity INVALID')),
			/* signature */ '0xba81fcf2352d66fef730d726be484842f4eb2c1f2bde8c27724fa96a5851b41a566c2481da26d841f703ea846adcdc29e6effeb1293b6527b44cb7f20e8b5ea800',
			/* signer    */ types.principal('ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5')
		]
		const response = chain.callReadOnlyFn('verified-messages', 'verify-message', args, deployer.address);
		response.result.expectBool(false);
	}
});

Clarinet.test({
	name: "Invalid signatures fail (wrong signer)",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!;
		const args = [
			/* message   */ types.buff(stringToArrayBuffer('Hello Clarity')),
			/* signature */ '0xba81fcf2352d66fef730d726be484842f4eb2c1f2bde8c27724fa96a5851b41a566c2481da26d841f703ea846adcdc29e6effeb1293b6527b44cb7f20e8b5ea800',
			/* signer    */ types.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')
		]
		const response = chain.callReadOnlyFn('verified-messages', 'verify-message', args, deployer.address);
		response.result.expectBool(false);
	}
});

Clarinet.test({
	name: "Can post message",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!;
		const message = types.buff(stringToArrayBuffer('Hello Clarity'));
		const signature = '0xba81fcf2352d66fef730d726be484842f4eb2c1f2bde8c27724fa96a5851b41a566c2481da26d841f703ea846adcdc29e6effeb1293b6527b44cb7f20e8b5ea800';
		const signer = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
		const block = chain.mineBlock([
			Tx.contractCall('verified-messages', 'post-message', [message, signature, types.principal(signer)], deployer.address)
		]);
		const [receipt] = block.receipts;
		const [event] = receipt.events;
		receipt.result.expectOk().expectBool(true);
		// Beware, this might break in a future version of Clarinet:
		assertEquals(event.contract_event.topic, 'print');
		assertEquals(event.contract_event.value, `{message: ${message}, signer: ${signer}}`);
	}
});

Clarinet.test({
	name: "Can check if message was posted",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!;
		const message = types.buff(stringToArrayBuffer('Hello Clarity'));
		const signature = '0xba81fcf2352d66fef730d726be484842f4eb2c1f2bde8c27724fa96a5851b41a566c2481da26d841f703ea846adcdc29e6effeb1293b6527b44cb7f20e8b5ea800';
		const signer = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
		chain.mineBlock([
			Tx.contractCall('verified-messages', 'post-message', [message, signature, types.principal(signer)], deployer.address)
		]);
		const response = chain.callReadOnlyFn('verified-messages', 'is-message-posted', [message, types.principal(signer)], deployer.address);
		response.result.expectBool(true);
	}
});

Clarinet.test({
	name: "Cannot post the same message twice",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!;
		const message = types.buff(stringToArrayBuffer('Hello Clarity'));
		const signature = '0xba81fcf2352d66fef730d726be484842f4eb2c1f2bde8c27724fa96a5851b41a566c2481da26d841f703ea846adcdc29e6effeb1293b6527b44cb7f20e8b5ea800';
		const signer = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
		const block = chain.mineBlock([
			Tx.contractCall('verified-messages', 'post-message', [message, signature, types.principal(signer)], deployer.address),
			Tx.contractCall('verified-messages', 'post-message', [message, signature, types.principal(signer)], deployer.address)
		]);
		const [, receipt] = block.receipts; // Notice the comma. This gets the second receipt.
		receipt.result.expectErr().expectUint(ErrorCodes.MessageAlreadyPosted);
		assertEquals(receipt.events.length, 0);
	}
});

Clarinet.test({
	name: "Cannot post message if signature is invalid",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!;
		const message = types.buff(stringToArrayBuffer('Hello Clarity INVALID'));
		const signature = '0xba81fcf2352d66fef730d726be484842f4eb2c1f2bde8c27724fa96a5851b41a566c2481da26d841f703ea846adcdc29e6effeb1293b6527b44cb7f20e8b5ea800';
		const signer = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
		const block = chain.mineBlock([
			Tx.contractCall('verified-messages', 'post-message', [message, signature, types.principal(signer)], deployer.address)
		]);
		const [receipt] = block.receipts;
		receipt.result.expectErr().expectUint(ErrorCodes.InvalidSignature);
		assertEquals(receipt.events.length, 0);
	}
});
