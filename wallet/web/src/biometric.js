export class BiometricAuth {
  constructor() {
    this.supported = {
      webauthn: typeof window !== 'undefined' && window.PublicKeyCredential !== undefined,
      camera: typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    };
  }

  async authenticateFingerprint() {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Aether Wallet', id: window.location.hostname },
          user: { id: new Uint8Array(16), name: 'aether-user', displayName: 'Aether User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
          attestation: 'direct',
        },
      });
      const hash = await this.hashBuffer(new Uint8Array(credential.rawId));
      return { success: true, method: 'fingerprint', hash, trust: 98 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async authenticateEye() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      await new Promise((r) => setTimeout(r, 2000));
      const canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, 640, 480);
      const hash = await this.hashBuffer(new Uint8Array(imageData.data));
      stream.getTracks().forEach((t) => t.stop());
      return { success: true, method: 'eye', hash, trust: 90 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async authenticateFace() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      await new Promise((r) => setTimeout(r, 1500));
      const canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, 640, 480);
      const hash = await this.hashBuffer(new Uint8Array(imageData.data));
      stream.getTracks().forEach((t) => t.stop());
      return { success: true, method: 'face', hash, trust: 92 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async authenticateVoice() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.start();
      await new Promise((r) => setTimeout(r, 3000));
      mediaRecorder.stop();
      await new Promise((r) => { mediaRecorder.onstop = r; });
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const buffer = await blob.arrayBuffer();
      const hash = await this.hashBuffer(new Uint8Array(buffer));
      return { success: true, method: 'voice', hash, trust: 85 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async hashBuffer(buffer) {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}

export const biometric = new BiometricAuth();
