import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const filePath = path.join(process.cwd(), 'user_submissions.json');
    
    let submissions: any[] = [];
    if (fs.existsSync(filePath)) {
      submissions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    
    // Add timestamp
    const entry = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    submissions.push(entry);
    fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));
    
    return NextResponse.json({ success: true, message: "Data received and stored successfully." });
  } catch (error) {
    console.error("Endpoint Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process data." }, { status: 500 });
  }
}
