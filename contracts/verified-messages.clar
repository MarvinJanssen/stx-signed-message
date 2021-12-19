;; Simple signed message verification contract
;; By Marvin Janssen

;; A buffer containing the ascii string "Stacks Signed Message: "
(define-constant message-prefix 0x537461636b73205369676e6564204d6573736167653a20)

;; A map that tracks all previous messages per principal.
(define-map message-registry {hash: (buff 32), signer: principal} bool)

(define-constant err-message-already-posted (err u100))
(define-constant err-invalid-signature (err u101))

(define-read-only (hash-message (message (buff 256)))
	(sha256 (concat message-prefix message))
)

(define-read-only (validate-signature (hash (buff 32)) (signature (buff 65)) (signer principal))
	(is-eq (principal-of? (unwrap! (secp256k1-recover? hash signature) false)) (ok signer))
)

(define-read-only (verify-message (message (buff 256)) (signature (buff 65)) (signer principal))
	(validate-signature (hash-message message) signature signer)
)

(define-read-only (is-message-posted (message (buff 256)) (signer principal))
	(is-some (map-get? message-registry {hash: (hash-message message), signer: signer}))
)

(define-public (post-message (message (buff 256)) (signature (buff 65)) (signer principal))
	(let
		(
			(hash (hash-message message))
		)
		(asserts! (is-none (map-get? message-registry {hash: hash, signer: signer})) err-message-already-posted)
		(asserts! (validate-signature hash signature signer) err-invalid-signature)
		;; Here you would make something fun happen.
		(print {message: message, signer: signer})
		(ok (map-set message-registry {hash: hash, signer: signer} true))
	)
)
