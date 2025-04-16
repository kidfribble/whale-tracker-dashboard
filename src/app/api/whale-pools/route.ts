// app/api/whale-pools/route.ts
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'src', 'data');
    const filePath = path.join(dataDir, 'whalePools.json');
    
    try {
      const fileContents = await readFile(filePath, 'utf-8');
      const whalePools = JSON.parse(fileContents);
      return NextResponse.json(whalePools);
    } catch (_) {
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error('Failed to handle whale pools request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
