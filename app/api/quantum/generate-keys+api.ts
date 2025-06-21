import { quantumCryptographyService } from '@/lib/quantum-cryptography';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { algorithm } = body;

    if (!algorithm) {
      return new Response('Algorithm is required', { status: 400 });
    }

    const keyPair = await quantumCryptographyService.generateQuantumKeyPair(algorithm);
    
    // Return only public information
    return Response.json({
      success: true,
      publicKey: Array.from(keyPair.publicKey),
      algorithm: keyPair.algorithm,
      keySize: keyPair.keySize,
      createdAt: keyPair.createdAt,
      expiresAt: keyPair.expiresAt
    });
  } catch (error) {
    console.error('Quantum key generation API error:', error);
    return Response.json(
      { success: false, error: 'Quantum key generation failed' },
      { status: 500 }
    );
  }
}