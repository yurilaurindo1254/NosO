import { NextResponse } from 'next/server';
import { PluggyClient } from 'pluggy-sdk';

export async function POST() {
  try {
    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing Pluggy credentials' },
        { status: 500 }
      );
    }

    const client = new PluggyClient({
      clientId,
      clientSecret,
    });

    const data = await client.createConnectToken();

    return NextResponse.json({ accessToken: data.accessToken });
  } catch (error) {
    console.error('Error creating Pluggy connect token:', error);
    return NextResponse.json(
      { error: 'Failed to create connect token' },
      { status: 500 }
    );
  }
}
