```typescript
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-server';

export async function GET(request: Request) {
  try {
    const db = getDatabase();
    
    // Fetch funds specifically from the FOF source table
    const funds = await db.getAllFunds('fof');
    
    return NextResponse.json({
      success: true,
      data: funds
    });
    
  } catch (error) {
    console.error('FOF API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
```
