import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';

export async function POST(req: NextRequest) {
  const { host, port, user, password, prefix, path } = await req.json();

  if (!host || !user) {
    return NextResponse.json({ error: 'Parametri FTP mancanti' }, { status: 400 });
  }

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host,
      port: port ? Number(port) : 21,
      user,
      password,
      secure: false,
    });

    const remotePath = path || '/root/imports';
    const list = await client.list(remotePath);

    const matched = list
      .filter(item => item.type === ftp.FileType.File && item.name.startsWith(prefix || ''))
      .map(item => item.name);

    return NextResponse.json({ files: matched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Errore FTP' }, { status: 500 });
  } finally {
    client.close();
  }
}
