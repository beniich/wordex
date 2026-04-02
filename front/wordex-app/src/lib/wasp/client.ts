/**
 * Wordex WASP (WebAssembly Signal Protocol) Interface
 * Encapsulates the cryptographic logic for end-to-end encryption.
 */

export class WASPManager {
  private keyPair: CryptoKeyPair | null = null;
  private sessionActive: boolean = false;

  /**
   * Initializes the cryptographic environment.
   * In a production scenario, this loads the WASM module.
   */
  async initialize() {
    // Generate an RSA-OAEP key pair for demonstration (simulating WASM Signal keys)
    this.keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
    this.sessionActive = true;
    console.log("WASP Protocol: Cryptographic Environment Initialized");
  }

  /**
   * Encrypts a message for a specific recipient.
   */
  async encryptMessage(message: string, recipientPublicKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      recipientPublicKey,
      data
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  /**
   * Decrypts a message sent to the local user.
   */
  async decryptMessage(encryptedMessage: string): Promise<string> {
    if (!this.keyPair) throw new Error("WASP: Keys not generated");

    const encryptedData = new Uint8Array(
      atob(encryptedMessage).split("").map((c) => c.charCodeAt(0))
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      this.keyPair.privateKey,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  }

  getPublicKey() {
    return this.keyPair?.publicKey;
  }

  isReady() {
    return this.sessionActive;
  }
}
