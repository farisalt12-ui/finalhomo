import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  return NextResponse.json({ ok: false, error: 'method_not_allowed' });
}

export async function POST(req) {
  try {
    const body = await req.json();

    const username = String(body.username ?? body.u ?? '').trim();
    const password = String(body.password ?? '');

    if (!username || !password) {
      return NextResponse.json({ ok: false, error: 'Missing credentials' }, { status: 400 });
    }

    // CORRECT HASH (from working source)
    const hashed = crypto
      .createHash('md5')
      .update(password)
      .digest('hex')
      .toUpperCase();

    // IMPORTANT TLS FIX
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const form = new URLSearchParams({
      u: username,
      p: hashed
    });

    const res = await fetch('https://violetbot.net:6963/check/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    const text = (await res.text()).trim();

    if (text === 'wrong_creds' || text === 'id_empty') {
      return NextResponse.json({ ok: false, error: 'Wrong credentials' });
    }

    if (text === 'unknown_err') {
      return NextResponse.json({ ok: false, error: 'Login failed' });
    }

    return NextResponse.json({ ok: true, id: text });

  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: 'Could not reach login server',
      details: e?.message
    });
  }
}
